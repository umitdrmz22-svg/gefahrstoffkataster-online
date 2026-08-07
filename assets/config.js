'use strict';
(function(){
  const shared=window.EHS_PLATFORM_CONFIG||{};
  const current=window.APP_CONFIG||{};
  const defaultSupabaseUrl='https://rqvcbjomrjccyuchxpuh.supabase.co';
  const defaultPublishableKey='sb_publishable_iKh-ZfqV3iJpr_9b7SErEA_XhrqnSsY';
  const defaultBaAppUrl='https://umitdrmz22-svg.github.io/ba-generator/';
  window.APP_CONFIG=Object.freeze({
    supabaseUrl:shared.supabaseUrl||current.supabaseUrl||defaultSupabaseUrl,
    supabasePublishableKey:shared.supabasePublishableKey||shared.supabaseAnonKey||current.supabasePublishableKey||defaultPublishableKey,
    appName:'Gefahrstoffkataster Online',
    productionOnly:true,
    baAppUrl:shared.baAppUrl||current.baAppUrl||defaultBaAppUrl
  });
})();
