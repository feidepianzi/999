// Cloudflare Pages Function: /api/data
export async function onRequestGet({ env }) {
    try {
        var value = await env.ARRAY_DATA_KV.get("array_data");
        return new Response(value || "[]", {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
    } catch(e) {
        return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
    }
}
export async function onRequestPost({ request, env }) {
    try {
        var body = await request.text();
        await env.ARRAY_DATA_KV.put("array_data", body);
        return new Response("OK", { status: 200 });
    } catch(e) {
        return new Response("ERROR:" + e.message, { status: 500 });
    }
}
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    });
}
