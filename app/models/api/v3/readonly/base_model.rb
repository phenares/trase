module Api
  module V3
    module Readonly
      class BaseModel < Api::V3::BaseModel
        def readonly?
          true
        end
      end
    end
  end
end