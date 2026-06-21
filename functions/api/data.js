// Cloudflare Pages Function: /api/data
export async function onRequestGet({ env }) {
    try {
        var value = await env.MY_KV.get("search_app_data_v2");
        var data;
        if (!value) {
            data = { frontend: [], backend1: [], backend2: [] };
        } else {
            try {
                data = JSON.parse(value);
            } catch(e) {
                data = { frontend: [], backend1: [], backend2: [] };
            }
            // Migration: if old format (array), convert to new format
            if (Array.isArray(data)) {
                data = { frontend: data, backend1: [], backend2: [] };
            }
        }
        return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
    } catch(e) {
        return new Response(JSON.stringify({ frontend: [], backend1: [], backend2: [] }), { 
            status: 200, 
            headers: { "Content-Type": "application/json" } 
        });
    }
}

export async function onRequestPost({ request, env }) {
    try {
        var body = await request.text();
        var data = JSON.parse(body);
        // Validate: must be object with frontend, backend1, backend2 arrays
        if (typeof data !== 'object' || Array.isArray(data)) {
            return new Response("Invalid format", { status: 400 });
        }
        // Ensure all fields exist
        if (!Array.isArray(data.frontend)) data.frontend = [];
        if (!Array.isArray(data.backend1)) data.backend1 = [];
        if (!Array.isArray(data.backend2)) data.backend2 = [];
        
        await env.MY_KV.put("search_app_data_v2", JSON.stringify(data));
        return new Response("OK", { status: 200 });
    } catch(e) {
        return new Response("ERROR:" + e.toString(), { status: 500 });
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
