require 'rails_helper'

RSpec.describe 'Attributes', type: :request do
  include_context 'api v3 brazil flows quants'
  include_context 'api v3 dashboards attributes'

  describe 'GET /api/v3/dashboards/attributes' do
    before(:each) do
      Api::V3::Readonly::Dashboards::FlowPath.refresh(sync: true, skip_dependents: true)
      Api::V3::Readonly::DashboardsAttribute.refresh(sync: true, skip_dependents: true)
      Api::V3::Readonly::Dashboards::FlowAttribute.refresh(sync: true, skip_dependencies: true)
      Api::V3::Readonly::Dashboards::NodeAttribute.refresh(sync: true, skip_dependencies: true)
    end

    it 'has the correct response structure' do
      get '/api/v3/dashboards/attributes'

      expect(@response).to have_http_status(:ok)
      expect(@response).to match_response_schema('dashboards_attributes')
    end
  end
end
