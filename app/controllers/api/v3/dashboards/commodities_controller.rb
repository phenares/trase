module Api
  module V3
    module Dashboards
      class CommoditiesController < ApiController
        include FilterParams
        include Collection
        skip_before_action :load_context

        def index
          initialize_collection_for_index

          render json: @collection,
                 root: 'data',
                 each_serializer: Api::V3::Dashboards::CommoditySerializer
        end

        def search
          ensure_required_param_present(:q)
          initialize_collection_for_search

          render json: @collection,
                 root: 'data',
                 each_serializer: Api::V3::Dashboards::CommoditySerializer
        end

        private

        def filter_klass
          FilterCommodities
        end
      end
    end
  end
end
