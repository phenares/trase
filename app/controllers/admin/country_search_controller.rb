module Admin
  class CountrySearchController < ::Api::V3::ApiController
    skip_before_action :load_context

    def index
      @q = Api::V3::Readonly::Dashboards::Country.ransack(params[:q])
      @nodes = @q.result.page(params[:page])

      render json: @nodes, root: 'data',
             each_serializer: Admin::CountrySearchSerializer
    end
  end
end
