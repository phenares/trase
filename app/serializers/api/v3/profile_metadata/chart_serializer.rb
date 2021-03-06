module Api
  module V3
    module ProfileMetadata
      class ChartSerializer < ActiveModel::Serializer
        attributes :id, :chart_type, :identifier, :title, :position

        has_many :children, serializer: self
      end
    end
  end
end
