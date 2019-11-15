// ==UserScript==
// @name         Drakor - Mods
// @namespace    https://www.drakor.com/
// @version      0.1.0
// @author       Between2Spaces
// @match        https://www.drakor.com/*
// @grant        none
// ==/UserScript==

(function () {

    window.mod = {

        autoBattle: true,

        autoSellCommons: false,

        autoSellLevel: 0,

        updateTimeout: 0,
        
        lastMouseMove: 0,

        xpath: {
            string: (xpath, context) => {
                return document.evaluate(xpath, context || document, null, XPathResult.STRING_TYPE, null).stringValue
            },
            integer: (xpath, context) => {
                return parseInt(mod.xpath.string(xpath, context).replace(',', '').trim())
            },
            node: (xpath, context) => {
                return document.evaluate(xpath, context || document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
            },
            nodes: (xpath, context) => {
                return document.evaluate(xpath, context || document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
            },
        },
    
        log: (msg) => {
            let message = { timestamp: mod.timestamp(), text: ('' + msg).trim() }
            console.log('%c' + message.timestamp + ' %c' + message.text, 'color:#444', 'color:#777')
        },
    
        timestamp: (date) => {
            let d = date || new Date
            return d.getFullYear() + '-' + mod.pad(d.getMonth() + 1) + '-' + mod.pad(d.getDate()) + 'T' + mod.pad(d.getHours()) + ':' + mod.pad(d.getMinutes()) + ':' + mod.pad(d.getSeconds())
        },
    
        pad: (number) => {
            return number.toString().padStart(2, '0')
        },
    
        available: (node) => {
            if (!node) return false
            while (node && node.tagName !== 'BODY') {
                let visibility = window.getComputedStyle(node).getPropertyValue('visibility')
                let display = window.getComputedStyle(node).getPropertyValue('display')
                if (visibility === 'hidden' || display === 'none' || node.disabled) return false
                node = node.parentNode
            }
            return true
        },
    
        click: (xpath, callback) => {
            let result = mod.xpath.nodes(xpath)
            for(let i = 0; i < result.snapshotLength; i++) {
                let node = result.snapshotItem(i)
                if (!mod.available(node)) continue
                mod.updateTimeout += 1100
                setTimeout(() => { node.click(); callback && callback() }, 50)
                return true
            }
        },

        battleLootRepair: () => {
            if (mod.click('//div[./text()="You have an ability"]')) return true
            if (mod.available(mod.xpath.node('//div[./text()="Note: You have "]'))) return mod.click('//div[@id="load-inventory"]')
            if (mod.click('//div[./text()="Hunt Creatures"]')) return true
            if (mod.click('//div[./b/text()="Start Battle!"]')) return true
            for (let i = 0; i < 10; i++) {
                if (mod.click('//div[contains(@class, "quickUse") and ./text()="' + (i === 9 ? 0 : i + 1) + ') Use"]')) return true
            }
            if (mod.click('//div[./text()="Get your Loot!"]')) return true
            if (mod.click('//div[./text()="Find Another Creature?"]')) return true
            if (mod.click('//div[./text()="Back to Inventory"]')) return true
            if (mod.click('//div[contains(@class, "linkRepair")]')) return true
            if (mod.click('//div[@title="Remaining Durability: 0"]')) return true
            if (mod.click('//div[@id="load-adventure"]')) return true
        },

        autoSell: () => {
            if (mod.click('//div[contains(@class, "linkSell")]')) return true
            if (mod.autoSellCommons && mod.click('//div[@id="char_inventory"]/div[contains(@class, "cardCommon")]')) return true
            if (mod.autoSellLevel && mod.click('//div[@id="char_inventory"]/div[contains(@class, "iconLevel") and ./text()="' + mod.autoSellLevel + '"]')) return true
        },

    }

    const head = document.getElementsByTagName('head')[0]
    const style = document.createElement('style')
    style.type = 'text/css'
    style.innerHTML = `
    `
    head.appendChild(style)

    document.addEventListener('mousemove', () => {mod.lastMouseMove = performance.now()})

    function doAutos() {
        if (mod.autoSell()) return
        if (mod.autoBattle) if (mod.battleLootRepair()) return
    }

    function update() {
        mod.updateTimeout = Math.floor(50 + Math.random() * 500)
        if ((performance.now() - mod.lastMouseMove) > 10000 && !mod.available(mod.xpath.node('//div[@id="skill-timer"]'))) doAutos()
        setTimeout(update, mod.updateTimeout)
    }

    update()

})()