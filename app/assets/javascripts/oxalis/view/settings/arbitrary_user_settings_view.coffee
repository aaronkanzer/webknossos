### define
./settings_view : SettingsView
./category_views/controls_category_view : ControlsCategoryView
./category_views/flight_category_view : FlightCategoryView
###

class ArbitraryUserSettingsView extends SettingsView


  id : "user-settings"


  modelName : "user"


  subviewCreators :

    "controls-category" : ->

      return new ControlsCategoryView({ @model })

    "flight-category" : ->

      return new FlightCategoryView({ @model })
