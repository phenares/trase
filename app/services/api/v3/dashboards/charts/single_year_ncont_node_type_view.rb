# Data for horizontal stacked bar chart widget
module Api
  module V3
    module Dashboards
      module Charts
        class SingleYearNcontNodeTypeView
          include Api::V3::Dashboards::Charts::Helpers

          OTHER = 'OTHER'.freeze

          # @param chart_parameters [Api::V3::Dashboards::ChartParameters]
          def initialize(chart_parameters)
            @cont_attribute = chart_parameters.cont_attribute
            @ncont_attribute = chart_parameters.ncont_attribute
            @context = chart_parameters.context
            @year = chart_parameters.start_year
            @node_type = chart_parameters.node_type
            @node_type_idx = chart_parameters.node_type_idx
            @nodes_ids_by_position = chart_parameters.nodes_ids_by_position
            @top_n = chart_parameters.top_n
            initialize_query
            initialize_top_n_and_others_query
          end

          def call
            break_by_values_indexes = ncont_break_by_values_map

            data_by_x = {}
            @top_n_and_others_query.each do |record|
              break_by_values_indexes.each do |break_by, idx|
                data_by_x[record['x']] ||= {}
                data_by_x[record['x']]["y#{idx}"] = record['per_break_by'][break_by]
              end
            end

            @data = data_by_x.map do |key, value|
              value.symbolize_keys.merge(x: key)
            end

            @meta = {
              xAxis: node_type_axis_meta(@node_type),
              yAxis: axis_meta(@cont_attribute, 'number'),
              x: node_type_legend_meta(@node_type)
            }

            break_by_values_indexes.each do |break_by, idx|
              @meta[:"y#{idx}"] = {
                label: break_by,
                tooltip: {prefix: '', format: '', suffix: ''}
              }
            end

            swap_x_and_y

            {data: @data, meta: @meta}
          end

          private

          def initialize_query
            @query = flow_query
            apply_node_type_x
            apply_ncont_attribute_break_by
            apply_cont_attribute_y
            apply_single_year_filter
            apply_flow_path_filters
          end

          def initialize_top_n_and_others_query
            subquery = <<~SQL
              (
                WITH q AS (#{@query.to_sql}),
                u1 AS (
                  SELECT x, JSONB_OBJECT_AGG(break_by, y0) AS per_break_by, SUM(y0) AS y
                  FROM q
                  GROUP BY x
                  ORDER BY SUM(y0) DESC LIMIT #{@top_n}
                ),
                u2 AS (
                  SELECT x, JSONB_OBJECT_AGG(break_by, y0), SUM(y0) AS y
                  FROM (
                    SELECT '#{OTHER}' AS x, break_by, SUM(y0) AS y0 FROM q
                    WHERE NOT EXISTS (SELECT 1 FROM u1 WHERE q.x = u1.x)
                    GROUP BY break_by
                  ) s GROUP BY x
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
