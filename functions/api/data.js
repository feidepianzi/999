export async function onRequestGet({env}){
  try{
    var v = await env.MY_KV.get("search_app_data_v2");
    var d;
    if(!v){ d = defaultObj(); }
    else {
      try { d = JSON.parse(v); } catch(e){ d = defaultObj(); }
      d = normalize(d);
    }
    return new Response(JSON.stringify(d), {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  } catch(e){
    return new Response(JSON.stringify(defaultObj()), {status:200, headers:{"Content-Type":"application/json"}});
  }
}

export async function onRequestPost({request, env}){
  try{
    var b = await request.text();
    var d = JSON.parse(b);
    if(typeof d !== "object" || Array.isArray(d)) return new Response("Invalid format", {status:400});
    d = normalize(d);
    await env.MY_KV.put("search_app_data_v2", JSON.stringify(d));
    return new Response("OK", {status:200});
  } catch(e){
    return new Response("ERROR:" + e.toString(), {status:500});
  }
}

export async function onRequestOptions(){
  return new Response(null, {
    headers:{
      "Access-Control-Allow-Origin":"*",
      "Access-Control-Allow-Methods":"GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":"Content-Type"
    }
  });
}

function defaultObj(){
  return { frontend:[], frontend1:[], frontend2:[], backend1:[], backend2:[], backend3:[], backend4:[], admin1Pwd:"", admin2Pwd:"", searchCounts:{} };
}

function normalize(d){
  if(Array.isArray(d)) d = {};
  var o = defaultObj();
  if(Array.isArray(d.frontend)) o.frontend = d.frontend;
  else if(Array.isArray(d.f)) o.frontend = d.f;
  if(Array.isArray(d.frontend1)) o.frontend1 = d.frontend1;
  if(Array.isArray(d.frontend2)) o.frontend2 = d.frontend2;
  if(d.searchCounts && typeof d.searchCounts === "object") o.searchCounts = d.searchCounts;
  if(Array.isArray(d.backend1)) o.backend1 = d.backend1;
  else if(Array.isArray(d.b1)) o.backend1 = d.b1;
  if(Array.isArray(d.backend2)) o.backend2 = d.backend2;
  else if(Array.isArray(d.b2)) o.backend2 = d.b2;
  if(Array.isArray(d.backend3)) o.backend3 = d.backend3;
  if(Array.isArray(d.backend4)) o.backend4 = d.backend4;
  if(typeof d.admin1Pwd === "string" && d.admin1Pwd) o.admin1Pwd = d.admin1Pwd;
  if(typeof d.admin2Pwd === "string" && d.admin2Pwd) o.admin2Pwd = d.admin2Pwd;
  return o;
}
