ActiveAdmin.register Api::V3::ContextProperty, as: 'ContextProperty' do
  menu parent: 'Yellow Tables'

  permit_params :context_id, :default_basemap, :is_disabled, :is_default,
                :is_subnational

  form do |f|
    f.semantic_errors
    inputs do
      input :context, as: :select, required: true,
        collection: Api::V3::Context.select_options
      input :default_basemap, as: :string
      input :is_disabled, as: :boolean, required: true
      input :is_default, as: :boolean, required: true
      input :is_subnational, as: :boolean, required: true
    end
    f.actions
  end

  index do
    column('Country') { |property| property.context&.country&.name }
    column('Commodity') { |property| property.context&.commodity&.name }
    column :is_disabled
    column :is_default
    column :is_subnational
    actions
  end

  filter :context, collection: -> { Api::V3::Context.select_options }
end
