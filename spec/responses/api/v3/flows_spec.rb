require 'rails_helper'

RSpec.describe 'Flows', type: :request do
  include_context 'api v3 brazil flows'
  include_context 'api v3 brazil flows quants'

  describe 'GET /api/v2/contexts/:context_id/flows' do
    it 'has the correct response structure' do
      get "/api/v3/contexts/#{api_v3_context.id}/flows",
          params: {
            flow_quant: api_v3_volume.name, year_start: 2015, include_columns: '3,6,7,8'
          }
      expect(@response.status).to eq 200
      expect(@response).to match_response_schema('flows')
    end
  end
end