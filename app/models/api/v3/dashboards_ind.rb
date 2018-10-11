# == Schema Information
#
# Table name: dashboards_inds
#
#  id                      :integer          not null, primary key
#  dashboards_attribute_id :integer          not null
#  ind_id                  :integer          not null
#  created_at              :datetime         not null
#  updated_at              :datetime         not null
#
# Indexes
#
#  dashboards_inds_dashboards_attribute_id_ind_id_key  (dashboards_attribute_id,ind_id) UNIQUE
#  index_dashboards_inds_on_dashboards_attribute_id    (dashboards_attribute_id)
#  index_dashboards_inds_on_ind_id                     (ind_id)
#
# Foreign Keys
#
#  fk_rails_...  (dashboards_attribute_id => dashboards_attributes.id) ON DELETE => cascade
#  fk_rails_...  (ind_id => inds.id) ON DELETE => cascade
#

module Api
  module V3
    class DashboardsInd < YellowTable
      belongs_to :dashboards_attribute
      belongs_to :ind

      def self.yellow_foreign_keys
        [
          {name: :dashboards_attribute_id, table_class: Api::V3::DashboardsAttribute}
        ]
      end

      def self.blue_foreign_keys
        [
          {name: :ind_id, table_class: Api::V3::Ind}
        ]
      end
    end
  end
end