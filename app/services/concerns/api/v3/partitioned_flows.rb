module Api
  module V3
    module PartitionedFlows
      def flows_table
        :"partitioned_flows_#{@context.id}"
      end

      def values_table(attribute_type)
        :"partitioned_flow_#{attribute_type}s_#{@context.id}"
      end

      def values_alias(attribute_type)
        :"flow_#{attribute_type}s"
      end

      def flow_quants_table
        values_table('quant')
      end

      def flow_inds_table
        values_table('ind')
      end

      def flow_quals_table
        values_table('qual')
      end
    end
  end
end
