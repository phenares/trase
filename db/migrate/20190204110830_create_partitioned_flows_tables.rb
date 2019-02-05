class CreatePartitionedFlowsTables < ActiveRecord::Migration[5.2]
  def change
    create_list_partition :partitioned_flows, partition_key: :context_id do |t|
      t.integer :context_id
      t.column :year, 'smallint'
      t.integer :path, array: true, default: []
    end

    create_list_partition :partitioned_flow_inds, partition_key: :context_id do |t|
      t.integer :context_id
      t.integer :flow_id
      t.integer :ind_id
      t.column :value, 'double precision'
    end

    create_list_partition :partitioned_flow_quals, partition_key: :context_id do |t|
      t.integer :context_id
      t.integer :flow_id
      t.integer :qual_id
      t.text :value
    end

    create_list_partition :partitioned_flow_quants, partition_key: :context_id do |t|
      t.integer :context_id
      t.integer :flow_id
      t.integer :quant_id
      t.column :value, 'double precision'
    end
  end
end
