// ==UserScript==
// @name         bonus-helper
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Eastarpen
// @match        https://audiences.me/torrents.php*
// @match        https://pterclub.com/torrents.php*
// @icon         https://www.google.com/s2/favicons?domain=audiences.me
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

// T 即 T0, N 即 N0, B 即 B0 这三个值每个站点不同
// W_FLAG 官方种子是否有权值 W 官种权值
let T, N, B, W

(function() {
    'use strict';
    if(load_constant(window.location.host)) modify_elements()
})();

// 配置传入的站点
function init(host) {
    //GM_setValue(host, '{"T":4, "N":7, "W":1.5}')
}

// 根据传入的host名称确定 T N W 值 若无法确定返回 false 成功确定返回true
function load_constant(host) {
    // data = '{"T":4, "N":7, "W":1.5}'
    var data = GM_getValue(host, '{}')
    if(data == '{}') {
        init(host) // 配置站点
        data = GM_getValue(host, '{}')
        if(data == '{}') return false // 用户未选择配置, 返回false
    }
    data = JSON.parse(data)
    T = data.T
    N = data.N
    W = data.W
    return true
}

// 创建一个新的 Html 元素 不可省略, 若无则值为 null
// _type 元素类型, _class 元素类名 _text 元素text值
function create_element(_type, _class = null, _text = null, _id = null) {
    var obj = document.createElement(_type)
    if(_text != null) obj.textContent = _text
    if(_class != null) obj.className = _class
    if(_id != null) obj.id = _id
    return obj
}

// 在种子页面的菜单栏中创建 A值 一栏
// menubar 菜单栏元素 一般 js 路径为 document.querySelector("#torrenttable > tbody > tr:nth-child(1)")
function add_A_menu(menubar) {
    var A = create_element('td', 'colhead', 'A值')
    menubar.insertBefore(A, menubar.children[8])
}

// 获取种子存活时间
// e 含存活时间信息的对象
function get_survival_time(e) {
    var upload_time = e.children[0].getAttribute('title') // 种子发布日期
    var survival_time = Date.now() - new Date(upload_time).getTime() // 种子存活时间 (单位 毫秒)
    return survival_time/604800000 // 返回种子存活周数
}

// 获取种子大小
// e 含种子大小信息的对象
function get_size(e) {
    var size_string = e.textContent // eg: '23.3GB'
    var size = parseFloat(size_string.substr(0, size_string.length-2)) // 23.3
    var unit = size_string.substr(size_string.length-2) // 'GB'
    var power = 1 // 将单位转换为 GB
    if(unit == 'TB') power = 1024
    else if(unit == 'MB') power = 1/1024
    else if(unit == 'KB') power = 1/1024/1024
    return size*power
}

// 获取种子做种人数
// e 含做种人数信息的对象
function get_seeders(e) {
    return parseInt(e.textContent)
}

// 判断是否是官方种子 e示例 document.querySelector("#torrenttable > tbody > tr:nth-child(2) > td.rowfollow.torrents-box")
function is_official(e) {
    var tags = e.querySelectorAll('span')
    var len = tags.length
    for (var i = 0; i < len; ++i) {
        var tag = tags[i]
        var info = tag.textContent
        if(info.search('官方') != -1 || info.search('官种') != -1) return true
    }
    return false
}

// 计算单个种子的A值
// t 种子存活时间(周) s 种子大小(GB) n 做种人数 w 权值(默认为1)
function calculate_A(t, s, n, w=1) {
    var a = 1 - Math.pow(10, -(t/T))
    var b = 1 + Math.pow(2, 0.5) * Math.pow(10, -(n-1)/(N-1))
    return a*s*b*w
}

// 添加每个种子的A值
// tr 每一个种子栏元素
function add_A_value(tr) {
    var survival_time = get_survival_time(tr.children[3])
    var size = get_size(tr.children[4])
    var seeders = get_seeders(tr.children[5])
    var A_value
    // 如果站点官种有额外权值且该种子是官种, 计算A值时应乘上权值
    if(W != 1 && is_official(tr.children[1])) A_value = calculate_A(survival_time, size, seeders, W)
    else A_value = calculate_A(survival_time, size, seeders)
    var A_tag = create_element('td', 'rowfollow', A_value.toFixed(2), 'A_value') // 保留两位有效数字
    // 默认当种子 A值 大于种子大小的 90% 且做种人数不低于 2 高亮该值
    if (A_value > size*0.9 && seeders >= 2) highlight_A_tag(A_tag)
    tr.insertBefore(A_tag, tr.children[8])
}

// 选择并修改元素
function modify_elements() {
    var parent = document.querySelector("#torrenttable > tbody")
    add_A_menu(parent.children[0]) // 菜单栏增加 A值 一栏
    for(var tr of parent.children) {
        if (tr == parent.children[0]) continue // 忽略菜单栏
        add_A_value(tr)
    }
}

// 高亮传入的 A值标签
function highlight_A_tag(A_tag) {
    A_tag.innerHTML = '<b style="color:red">'+A_tag.textContent+'</b>'
}

// 取消传入的 A值标签 的高亮
function unhighlight_A_tag(A_tag) {
     A_tag.innerHTML = A_tag.textContent
}
