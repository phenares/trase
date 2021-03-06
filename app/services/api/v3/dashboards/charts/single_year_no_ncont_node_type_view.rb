# Data for horizontal bar chart widget
module Api
  module V3
    module Dashboards
      module Charts
        class SingleYearNoNcontNodeTypeView
          include Api::V3::Dashboards::Charts::Helpers

          OTHER = 'OTHER'.freeze

          # @param chart_parameters [Api::V3::Dashboards::ChartParameters]
          def initialize(chart_parameters)
            @cont_attribute = chart_parameters.cont_attribute
            @context = chart_parameters.context
            @year = chart_parameters.start_year
            @node_type = chart_parameters.node_type
            @node_type_idx = chart_parameters.node_type_idx
            @nodes_ids_by_position = chart_parameters.nodes_ids_by_position
            initialize_query
            initialize_top_n_and_others_query(chart_parameters.top_n)
          end

          def call
            @data = @top_n_and_others_query.map do |r|
              r.attributes.slice('x', 'y0').symbolize_keys
            end
            if (last = @data.last) && last[:x] == OTHER && last[:y0].blank?
              @data.pop
            end
            @meta = {
              xAxis: node_type_axis_meta(@node_type),
              yAxis: axis_meta(@cont_attribute, 'number'),
              x: node_type_legend_meta(@node_type),
              y0: legend_meta(@cont_attribute)
            }

            swap_x_and_y

            {data: @data, meta: @meta}
          end

          private

          def initialize_query
            @query = flow_query
            apply_node_type_x
            apply_cont_attribute_y
            apply_single_year_filter
            apply_flow_path_filters
          end

          def initialize_top_n_and_others_query(top_n)
            subquery = <<~SQL
              (
                WITH q AS (#{@query.to_sql}),
                u1 AS (SELECT x, y0 FROM q ORDER BY y0 DESC LIMIT #{top_n}),
                u2 AS (
                  SELECT '#{OTHER}' AS x, SUM(y0) AS y0 FROM q
                  WHERE NOT EXISTS (SELECT 1 FROM u1 WHERE q.x = u1.x)
                )
                SELECT * FROM u1
                UNION ALL
                SELECT * FROM u2
              ) flows
            SQL
            @top_n_and_others_query = Api::V3::Flow.from(subquery)
          end
        end
      end
    end
  end
end
