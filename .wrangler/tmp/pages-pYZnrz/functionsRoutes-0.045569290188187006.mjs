import { onRequest as __api_settings_defaults_js_onRequest } from "/Users/elnueve/Documents/Enrollio/EasyCal/easycal/functions/api/settings/defaults.js"
import { onRequest as __api_brand_config_js_onRequest } from "/Users/elnueve/Documents/Enrollio/EasyCal/easycal/functions/api/brand-config.js"
import { onRequest as __api_calendars_js_onRequest } from "/Users/elnueve/Documents/Enrollio/EasyCal/easycal/functions/api/calendars.js"
import { onRequest as __api_debug_token_js_onRequest } from "/Users/elnueve/Documents/Enrollio/EasyCal/easycal/functions/api/debug-token.js"
import { onRequest as __api_detect_location_js_onRequest } from "/Users/elnueve/Documents/Enrollio/EasyCal/easycal/functions/api/detect-location.js"
import { onRequest as __api_import_calendars_js_onRequest } from "/Users/elnueve/Documents/Enrollio/EasyCal/easycal/functions/api/import-calendars.js"
import { onRequest as __api_location_timezone_js_onRequest } from "/Users/elnueve/Documents/Enrollio/EasyCal/easycal/functions/api/location-timezone.js"
import { onRequest as __api_locations_js_onRequest } from "/Users/elnueve/Documents/Enrollio/EasyCal/easycal/functions/api/locations.js"
import { onRequest as __api_test_auth_js_onRequest } from "/Users/elnueve/Documents/Enrollio/EasyCal/easycal/functions/api/test-auth.js"
import { onRequest as __auth_callback_js_onRequest } from "/Users/elnueve/Documents/Enrollio/EasyCal/easycal/functions/auth/callback.js"
import { onRequest as __auth_callback_old_js_onRequest } from "/Users/elnueve/Documents/Enrollio/EasyCal/easycal/functions/auth/callback-old.js"
import { onRequest as __auth_install_js_onRequest } from "/Users/elnueve/Documents/Enrollio/EasyCal/easycal/functions/auth/install.js"

export const routes = [
    {
      routePath: "/api/settings/defaults",
      mountPath: "/api/settings",
      method: "",
      middlewares: [],
      modules: [__api_settings_defaults_js_onRequest],
    },
  {
      routePath: "/api/brand-config",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_brand_config_js_onRequest],
    },
  {
      routePath: "/api/calendars",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_calendars_js_onRequest],
    },
  {
      routePath: "/api/debug-token",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_debug_token_js_onRequest],
    },
  {
      routePath: "/api/detect-location",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_detect_location_js_onRequest],
    },
  {
      routePath: "/api/import-calendars",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_import_calendars_js_onRequest],
    },
  {
      routePath: "/api/location-timezone",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_location_timezone_js_onRequest],
    },
  {
      routePath: "/api/locations",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_locations_js_onRequest],
    },
  {
      routePath: "/api/test-auth",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_test_auth_js_onRequest],
    },
  {
      routePath: "/auth/callback",
      mountPath: "/auth",
      method: "",
      middlewares: [],
      modules: [__auth_callback_js_onRequest],
    },
  {
      routePath: "/auth/callback-old",
      mountPath: "/auth",
      method: "",
      middlewares: [],
      modules: [__auth_callback_old_js_onRequest],
    },
  {
      routePath: "/auth/install",
      mountPath: "/auth",
      method: "",
      middlewares: [],
      modules: [__auth_install_js_onRequest],
    },
  ]