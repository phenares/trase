module Api
  module V3
    class TablePartitions
      def initialize(context_id)
        self.class.ensure_partitioned_tables_exist
        @context_id = context_id
      end

      def self.create
        ensure_partitioned_tables_exist
        # get all context ids
        context_ids = Api::V3::Context.pluck(:id)
        # each context in separate flows table
        context_ids.each do |context_id|
          new(context_id).create
        end
      end

      def self.drop
        ['flows_\d+', 'flow_inds_\d+', 'flow_quals_\d+', 'flow_quants_\d+'].each do |re|
          sql = <<~SQL
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name ~ '#{re}'
          SQL
          result = execute(sql)
          result.each do |row|
            execute "DROP TABLE #{row['table_name']}"
          end
        end
      end

      def create
        create_partition_for_context('partitioned_flows')

        %w(inds quals quants).each do |attributes|
          create_partition_for_context("partitioned_flow_#{attributes}")
        end
      end

      def self.ensure_partitioned_tables_exist
        %w(flows flow_inds flow_quals flow_quants).each do |table_name|
          partitioned_table_name = "partitioned_#{table_name}"
          unless ActiveRecord::Base.connection.table_exists? partitioned_table_name
            raise("#{partitioned_table_name} doesn't exist")
          end
        end
      end

      private

      def create_partition_for_context(table_name)
        partition_name = "#{table_name}_#{@context_id}"
        create_partition_table(table_name, partition_name)
        add_check_constraint(
          partition_name,
          "#{partition_name}_context_id_check",
          "context_id = #{@context_id}"
        )
        send(:"insert_#{table_name}", partition_name)
        send(:"index_#{table_name}", partition_name)
        attach_partition(table_name, partition_name, @context_id)
      end

      def create_partition_table(table_name, partition_name)
        execute(
          <<~SQL
            CREATE TABLE #{partition_name}
              (LIKE #{table_name} INCLUDING DEFAULTS INCLUDING CONSTRAINTS);
          SQL
        )
      end

      def add_check_constraint(partition_name, check_name, check_condition)
        execute(
          <<~SQL
            ALTER TABLE #{partition_name}
              ADD CONSTRAINT #{check_name}
              CHECK (#{check_condition});
          SQL
        )
      end

      def insert_partitioned_flows(partition_name)
        execute(
          <<~SQL
            INSERT INTO #{partition_name}
            (id, context_id, year, path)
            SELECT id, context_id, year, path
            FROM flows
            WHERE context_id = #{@context_id};
          SQL
        )
      end

      def insert_partitioned_flow_inds(partition_name)
        execute(
          <<~SQL
            INSERT INTO #{partition_name}
            (id, context_id, flow_id, ind_id, value)
            SELECT flow_inds.id, flows.context_id, flow_id, ind_id, value
            FROM flow_inds
            JOIN flows ON flow_inds.flow_id = flows.id
            WHERE context_id = #{@context_id};
          SQL
        )
      end

      def insert_partitioned_flow_quals(partition_name)
        execute(
          <<~SQL
            INSERT INTO #{partition_name}
            (id, context_id, flow_id, qual_id, value)
            SELECT flow_quals.id, flows.context_id, flow_id, qual_id, value
            FROM flow_quals
            JOIN flows ON flow_quals.flow_id = flows.id
            WHERE context_id = #{@context_id};
          SQL
        )
      end

      def insert_partitioned_flow_quants(partition_name)
        execute(
          <<~SQL
            INSERT INTO #{partition_name}
            (id, context_id, flow_id, quant_id, value)
            SELECT flow_quants.id, flows.context_id, flow_id, quant_id, value
            FROM flow_quants
            JOIN flows ON flow_quants.flow_id = flows.id
            WHERE context_id = #{@context_id};
          SQL
        )
      end

      def index_partitioned_flows(partition_name)
        create_index(partition_name, 'context_id')
        create_index(partition_name, 'year')
        context = Api::V3::Context.find(@context_id)
        path_elements = context.context_node_types.count
        path_elements.times do |idx|
          execute(
            <<~SQL
              CREATE INDEX index_#{partition_name}_on_path_#{idx + 1}
                  ON #{partition_name} USING btree
                  ((path[#{idx + 1}]))
            SQL
          )
        end
      end

      def index_partitioned_flow_inds(partition_name)
        create_index(partition_name, 'context_id')
        create_index(partition_name, 'flow_id')
        create_index(partition_name, 'ind_id')
      end

      def index_partitioned_flow_quals(partition_name)
        create_index(partition_name, 'context_id')
        create_index(partition_name, 'flow_id')
        create_index(partition_name, 'qual_id')
      end

      def index_partitioned_flow_quants(partition_name)
        create_index(partition_name, 'context_id')
        create_index(partition_name, 'flow_id')
        create_index(partition_name, 'quant_id')
      end

      def create_index(partition_name, column_name, index_type = 'btree')
        execute(
          <<~SQL
            CREATE INDEX index_#{partition_name}_on_#{column_name}
              ON #{partition_name} USING #{index_type}
              (#{column_name})
          SQL
        )
      end

      def attach_partition(table_name, partition_name, list)
        execute(
          <<~SQL
            ALTER TABLE #{table_name} ATTACH PARTITION #{partition_name}
              FOR VALUES IN (#{list});
          SQL
        )
      end

      def execute(sql)
        ActiveRecord::Base.connection.execute sql
      end
    end
  end
end
