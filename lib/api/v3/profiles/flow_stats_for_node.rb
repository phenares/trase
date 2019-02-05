module Api
  module V3
    module Profiles
      class FlowStatsForNode
        def initialize(context, year, node)
          @context = context
          @year = year
          @node = node
          @node_index = NodeType.node_index_for_id(@context, node.node_type_id)
        end

        def flow_values(year, attribute)
          flow_values_for_attributes(year, [attribute])
        end

        def available_years_for_attribute(attribute)
          flow_values_all_years(attribute).select(:year).order(:year).distinct.pluck(:year)
        end

        def flow_values_totals_for_attributes_into(attributes, other_node_type, other_node_id)
          other_node_index = Api::V3::NodeType.node_index_for_name(@context, other_node_type)
          attribute_type = attributes.first&.class&.name&.demodulize&.downcase
          values_table = :"flow_#{attribute_type}s"
          attributes_table = :"#{attribute_type}s"
          nodes_join_clause = ActiveRecord::Base.send(
            :sanitize_sql_array,
            ['JOIN nodes ON nodes.id = flows.path[?]',
             other_node_index]
          )
          group_clause = ActiveRecord::Base.send(
            :sanitize_sql_array,
            ["flows.path[?], #{attributes_table}.name",
             other_node_index]
          )

          flow_values_for_attributes(@year, attributes).
            select("SUM(CAST(#{values_table}.value AS DOUBLE PRECISION)) AS value, #{attributes_table}.name").
            joins(values_table => attribute_type).
            joins(nodes_join_clause).
            where('? = path[?]', other_node_id, other_node_index).
            where('NOT is_unknown').
            group(group_clause)
        end

        private

        def flow_values_all_years(attribute)
          attribute_type = attribute.class.name.demodulize.downcase
          values_table = values_table(attribute_type)
          values_alias = values_alias(attribute_type)
          Api::V3::Flow.
            from("#{flows_table} #{flows_alias}").
            joins("JOIN #{values_table} #{values_alias} ON #{values_alias}.flow_id = #{flows_alias}.id").
            where("#{values_alias}.#{attribute_type}_id" => attribute.id).
            where('path[?] = ?', @node_index, @node.id)
        end

        def flow_values_for_attributes(year, attributes)
          attributes_ids = attributes.map(&:id)
          attribute_type = attributes.first&.class&.name&.demodulize&.downcase
          values_table = values_table(attribute_type)
          values_alias = values_alias(attribute_type)
          Api::V3::Flow.
            from("#{flows_table} #{flows_alias}").
            joins("JOIN #{values_table} #{values_alias} ON #{values_alias}.flow_id = #{flows_alias}.id").
            where("#{values_alias}.#{attribute_type}_id" => attributes_ids).
            where('path[?] = ?', @node_index, @node.id).
            where(year: year)
        end

        def flows_table
          :"partitioned_flows_#{@context.id}"
        end

        def flows_alias
          :flows
        end

        def values_table(attribute_type)
          :"partitioned_flow_#{attribute_type}s_#{@context.id}"
        end

        def values_alias(attribute_type)
          :"flow_#{attribute_type}s"
        end
      end
    end
  end
end
