<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title></title>
    <style>
        body{font-family:Arial,sans-serif;max-width:600px;margin:20px auto;padding:10px;text-align:center}
        .search-box{margin:150px 0}
        input[type=password]{padding:10px;font-size:16px;width:90%;max-width:300px;text-align:center;border:none;outline:none;border-bottom:1px solid #ccc}
        .result{font-size:80px;font-weight:bold;margin-top:10px;height:100px;line-height:100px;word-wrap:break-word;overflow:hidden}
        .result.found{color:green}
        .result.not-found{color:red}
        .secret-zone{position:absolute;top:0;right:0;width:100px;height:100px;cursor:pointer;opacity:0}
        .modal-overlay{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000}
        .modal{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:30px;border-radius:8px;min-width:350px;max-width:90%;max-height:90vh;overflow-y:auto}
        .modal h2{margin-top:0;font-size:18px}
        .modal h3{margin:15px 0 5px;font-size:14px;color:#333}
        .modal textarea{width:100%;height:120px;margin:5px 0;padding:8px;font-size:13px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box}
        .modal input[type=password]{padding:8px;font-size:14px;width:200px;margin:10px 0;box-sizing:border-box}
        .modal button{padding:8px 16px;font-size:14px;margin:5px;border:none;cursor:pointer;border-radius:4px}
        .modal .btn-save{background:#28a745;color:#fff}
        .modal .btn-cancel{background:#dc3545;color:#fff}
        .modal .btn-confirm{background:#007bff;color:#fff}
        .modal .btn-clear{background:#ffc107;color:#000}
        .array-count{font-size:12px;color:#666;margin-left:10px}
        .error-msg{color:red;font-size:14px;margin-top:10px}
        @media(max-width:600px){body{margin:10px auto;padding:5px}.result{font-size:60px;height:80px;line-height:80px}.modal{min-width:280px;padding:20px}}
    </style>
</head>
<body>
    <div class="secret-zone" onclick="showPasswordPrompt()"></div>
    <div class="search-box"><input type="password" id="numberInput" /></div>
    <div id="result" class="result"></div>
    <div id="passwordModal" class="modal-overlay">
        <div class="modal">
            <h2>请输入密码</h2>
            <input type="password" id="passwordInput" placeholder="密码" /><br/>
            <button class="btn-confirm" onclick="checkPassword()">确认</button>
            <button class="btn-cancel" onclick="hidePasswordPrompt()">取消</button>
            <div id="passwordError" class="error-msg"></div>
        </div>
    </div>
    <div id="updateModal" class="modal-overlay">
        <div class="modal">
            <h2>管理数组数据</h2>
            <h3>主数组 (frontend) <span id="countFrontend" class="array-count"></span></h3>
            <textarea id="inputFrontend" placeholder="每行一个编号"></textarea>
            <button class="btn-clear" onclick="clearFrontend()">一键清除主数组</button>
            <h3>后台数组1 (backend1) <span id="countBackend1" class="array-count"></span></h3>
            <textarea id="inputBackend1" placeholder="每行一个编号"></textarea>
            <button class="btn-clear" onclick="clearBackend1()">一键清除 backend1</button>
            <h3>后台数组2 (backend2) <span id="countBackend2" class="array-count"></span></h3>
            <textarea id="inputBackend2" placeholder="每行一个编号"></textarea>
            <button class="btn-clear" onclick="clearBackend2()">一键清除 backend2</button>
            <div style="margin-top:15px">
                <button class="btn-save" onclick="saveAllArrays()">保存全部</button>
                <button class="btn-cancel" onclick="hideUpdateModal()">取消</button>
            </div>
            <div id="updateMsg" class="error-msg"></div>
        </div>
    </div>
    <script>
        var PASSWORD = "woainimm";
        var dataObj = { frontend: [], backend1: [], backend2: [] };
        var numbersArray = [];

        async function loadArray() {
            try {
                var resp = await fetch("/api/data");
                if (resp.ok) {
                    dataObj = await resp.json();
                    // Merge all arrays for search
                    numbersArray = (dataObj.frontend || []).concat(dataObj.backend1 || [], dataObj.backend2 || []);
                }
            } catch(e) {
                console.error("load error:", e);
                dataObj = { frontend: [], backend1: [], backend2: [] };
                numbersArray = [];
            }
        }

        async function saveAllArraysToStorage() {
            await fetch("/api/data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataObj)
            });
        }

        loadArray();

        var debounceTimer = null;
        function checkNumber() {
            var n = document.getElementById("numberInput").value.trim();
            var r = document.getElementById("result");
            if (!n) { r.className = "result"; r.textContent = ""; return; }
            var found = numbersArray.indexOf(n) >= 0;
            r.className = "result " + (found ? "found" : "not-found");
            r.textContent = found ? "👌" : "😒";
        }

        document.getElementById("numberInput").addEventListener("input", function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(checkNumber, 500);
        });
        document.getElementById("numberInput").addEventListener("keypress", function(e) {
            if (e.key === "Enter") { clearTimeout(debounceTimer); checkNumber(); }
        });

        function showPasswordPrompt() {
            var m = document.getElementById("passwordModal");
            m.style.display = "block";
            document.getElementById("passwordInput").value = "";
            document.getElementById("passwordError").textContent = "";
            document.getElementById("passwordInput").focus();
        }
        function hidePasswordPrompt() { document.getElementById("passwordModal").style.display = "none"; }
        function checkPassword() {
            if (document.getElementById("passwordInput").value === PASSWORD) {
                hidePasswordPrompt();
                showUpdateModal();
            } else {
                document.getElementById("passwordError").textContent = "密码错误！";
            }
        }
        document.getElementById("passwordInput").addEventListener("keypress", function(e) {
            if (e.key === "Enter") checkPassword();
        });

        function parseInput(input) {
            if (!input.trim()) return [];
            return input.split(/\W+/).map(function(s){return s.trim();}).filter(function(s){return /\d/.test(s);}).map(function(s){return s.replace(/^[^0-9]*/,"").replace(/[^0-9]+$/,"");});
        }

        function showUpdateModal() {
            document.getElementById("updateModal").style.display = "block";
            document.getElementById("inputFrontend").value = (dataObj.frontend || []).join("\n");
            document.getElementById("inputBackend1").value = (dataObj.backend1 || []).join("\n");
            document.getElementById("inputBackend2").value = (dataObj.backend2 || []).join("\n");
            updateCounts();
            document.getElementById("updateMsg").textContent = "";
        }

        function updateCounts() {
            var fe = parseInput(document.getElementById("inputFrontend").value);
            var b1 = parseInput(document.getElementById("inputBackend1").value);
            var b2 = parseInput(document.getElementById("inputBackend2").value);
            document.getElementById("countFrontend").textContent = "(" + fe.length + " 条)";
            document.getElementById("countBackend1").textContent = "(" + b1.length + " 条)";
            document.getElementById("countBackend2").textContent = "(" + b2.length + " 条)";
        }

        document.getElementById("inputFrontend").addEventListener("input", updateCounts);
        document.getElementById("inputBackend1").addEventListener("input", updateCounts);
        document.getElementById("inputBackend2").addEventListener("input", updateCounts);

        function hideUpdateModal() { document.getElementById("updateModal").style.display = "none"; }

        function clearFrontend() {
            if (confirm("确定要清除主数组 (frontend) 吗？")) {
                document.getElementById("inputFrontend").value = "";
                updateCounts();
            }
        }
        function clearBackend1() {
            if (confirm("确定要清除 backend1 数组吗？")) {
                document.getElementById("inputBackend1").value = "";
                updateCounts();
            }
        }
        function clearBackend2() {
            if (confirm("确定要清除 backend2 数组吗？")) {
                document.getElementById("inputBackend2").value = "";
                updateCounts();
            }
        }

        async function saveAllArrays() {
            var msgEl = document.getElementById("updateMsg");
            dataObj.frontend = parseInput(document.getElementById("inputFrontend").value);
            dataObj.backend1 = parseInput(document.getElementById("inputBackend1").value);
            dataObj.backend2 = parseInput(document.getElementById("inputBackend2").value);
            
            var total = dataObj.frontend.length + dataObj.backend1.length + dataObj.backend2.length;
            if (total === 0) {
                msgEl.textContent = "没有有效的数据！";
                msgEl.style.color = "red";
                return;
            }
            
            await saveAllArraysToStorage();
            numbersArray = dataObj.frontend.concat(dataObj.backend1, dataObj.backend2);
            msgEl.textContent = "保存成功！共 " + total + " 条数据。";
            msgEl.style.color = "green";
            setTimeout(hideUpdateModal, 2000);
        }
    </script>
</body>
</html>
