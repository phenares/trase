require 'rails_helper'

RSpec.describe Api::V3::Dashboards::Charts::MultiYearNoNcontNodeTypeView do
  include_context 'api v3 brazil resize by attributes'
  include_context 'api v3 brazil flows quants'

  before(:each) do
    Api::V3::Readonly::Attribute.refresh(sync: true, skip_dependents: true)
    Api::V3::Readonly::ResizeByAttribute.refresh(sync: true, skip_dependents: true)
  end

  let(:cont_attribute) { api_v3_volume.readonly_attribute }
  let(:node_type) { api_v3_exporter_node_type }

  let(:shared_parameters_hash) {
    {
      country_id: api_v3_brazil.id,
      commodity_id: api_v3_soy.id,
      cont_attribute_id: cont_attribute.id,
      node_type_id: node_type.id,
      start_year: 2015,
      end_year: 2016,
      top_n: 10
    }
  }

  let(:chart_parameters) {
    Api::V3::Dashboards::ChartParameters.new(parameters_hash)
  }

  let(:result) {
    Api::V3::Dashboards::Charts::MultiYearNoNcontNodeTypeView.new(
      chart_parameters
    ).call
  }

  let(:data) { result[:data] }
  let(:exporter1_idx) {
    result[:meta].each do |meta_key, meta|
      break meta_key if meta[:label] == api_v3_exporter1_node.name
    end
  }

  let(:other_exporter_idx) {
    result[:meta].each do |meta_key, meta|
      break meta_key if meta[:label] == api_v3_other_exporter_node.name
    end
  }

  describe :call do
    context 'when no flow path filters' do
      let(:parameters_hash) { shared_parameters_hash }
      it 'summarized all flows per year' do
        expect(data.size).to eq(1)
        expect(data[0][:x]).to eq(2015)
        expect(data[0][exporter1_idx]).to eq(75)
      end
    end

    context 'when filtered by 1 exporter' do
      let(:parameters_hash) {
        shared_parameters_hash.merge(companies_ids: [api_v3_other_exporter_node.id])
      }
      it 'summarized flows matching exporter per ncont' do
        expect(data.size).to eq(1)
        expect(data[0][:x]).to eq(2015)
        expect(data[0][exporter1_idx]).to be_nil
        expect(data[0][other_exporter_idx]).to eq(25)
      end
    end

    context 'when filtered by 2 exporters' do
      let(:parameters_hash) {
        shared_parameters_hash.merge(
          companies_ids: [
            api_v3_exporter1_node.id, api_v3_other_exporter_node.id
          ]
        )
      }
      it 'summarized flows matching either exporter per ncont' do
        expect(data.size).to eq(1)
        expect(data[0][:x]).to eq(2015)
        expect(data[0][exporter1_idx]).to eq(75)
        expect(data[0][other_exporter_idx]).to eq(25)
      end
    end

    context 'when filtered by 1 exporter and 1 importer' do
      let(:parameters_hash) {
        shared_parameters_hash.merge(
          companies_ids: [
            api_v3_other_exporter_node.id, api_v3_importer1_node.id
          ]
        )
      }
      it 'summarized flows matching exporter AND importer per ncont' do
        expect(data.size).to eq(1)
        expect(data[0][:x]).to eq(2015)
        expect(data[0][exporter1_idx]).to be_nil
        expect(data[0][other_exporter_idx]).to eq(25)
      end
    end

    context 'when filtered by 2 exporters and 2 importers' do
      let(:parameters_hash) {
        shared_parameters_hash.merge(
          companies_ids: [
            api_v3_exporter1_node.id,
            api_v3_other_exporter_node.id,
            api_v3_importer1_node.id,
            api_v3_other_importer_node.id
          ]
        )
      }
      it 'summarized flows matching either exporter AND either importer per ncont' do
        expect(data.size).to eq(1)
        expect(data[0][:x]).to eq(2015)
        expect(data[0][exporter1_idx]).to eq(75)
        expect(data[0][other_exporter_idx]).to eq(25)
      end
    end
  end
end
