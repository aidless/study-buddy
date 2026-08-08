await sleep(1000)
await typeByPlaceholder('you@example.com', EMAIL)
await typeByPlaceholder('鑷冲皯 6 浣?, PASS)
await clickByText('杩涘叆')
await page.waitForFunction(() => document.body.innerText.includes('浠婂ぉ杩樻病鎵撳崱'), { timeout: 30000 })
await sleep(2000)

// 1) 鍊掕鏃堕濉?+ 椤堕儴鑰冭瘯鍒囨崲
let t = await bodyText()
ok('鑰冪爺鍊掕鏃跺凡棰勫～锛?026-12-19锛?, t.includes('鑰冪爺鍒濊瘯') && t.includes('璺濈'), '')
t = await bodyText()
ok('椤堕儴鑰冭瘯鍒囨崲鎸夐挳', t.includes('褰撳墠鑰冭瘯锛氳€冪爺'), '')
await page.screenshot({ path: path.join(OUT, '11-today-cd.png') })

// 2) 娣卞懠鍚搁粯璁ゅ睍寮€锛堜笓娉ㄩ〉锛?await tapTab('涓撴敞')
await sleep(1200)
t = await bodyText()
ok('娣卞懠鍚搁粯璁ゅ睍寮€锛堝彲瑙佸紑濮嬫寜閽級', t.includes('娣卞懠鍚?) && t.includes('寮€濮?60 绉掑懠鍚?), '')
await page.screenshot({ path: path.join(OUT, '12-breathing.png') })

// 3) 鑷祴妯″潡 + 闅忔満鑰冭瘯
await tapTab('鑷祴')
await sleep(2200)
t = await bodyText()
ok('鑷祴妯″潡锛堟寮忚€冭瘯 + 鐪熼搴擄級', t.includes('姝ｅ紡鑰冭瘯') && t.includes('鐪熼搴?) && t.includes('闅忔満缁勫嵎'), '')
await page.screenshot({ path: path.join(OUT, '13-selftest.png') })

await clickByText('寮€濮嬮殢鏈鸿€冭瘯')
await sleep(1500)
t = await bodyText()
ok('鑰冭瘯寮€濮嬶紙闄愭椂 + 閫愰锛?, t.includes('绗?1/') && (t.includes('180:00') || t.includes('179:5')), '')
ok('鑰冭瘯涓叏灞忛攣 App 閬僵', await page.evaluate(() => !!document.querySelector('.quiz-overlay')), '')
await page.screenshot({ path: path.join(OUT, '14-exam.png') })

// 4) 鑰冭瘯涓垏鎹?Tab 琚嫤鎴?await tapTab('澶囪€?)
await sleep(600)
const stillExam = await page.evaluate(() => !!document.querySelector('.quiz-overlay'))
ok('鑰冭瘯涓垏 Tab 琚嫤鎴?, stillExam, '')

// 5) 绛斿墠 6 棰橈紙鍏ㄩ€?A锛屽繀閿欒嫢骞诧級鍚庝氦鍗?for (let i = 0; i < 6; i++) {
  await page.evaluate(() => {
    const opt = document.querySelector('.quiz-opt')
    opt && opt.click()
    const next = [...document.querySelectorAll('.quiz-nav button')].find((b) => (b.textContent || '').includes('涓嬩竴棰?))
    next && next.click()
  })
  await sleep(120)
}
await clickByText('浜ゅ嵎')
await sleep(2500)
t = await bodyText()
ok('浜ゅ嵎鑷姩鍒ゅ垎锛堟€诲垎锛?, t.includes('鑰冭瘯缁撴灉') && t.includes('閫夋嫨棰?), '')
ok('鍚勭琛ㄧ幇锛堣杽寮辩偣锛?, t.includes('鍚勭琛ㄧ幇'), '')
ok('閿欓鍥為【 + 瑙ｆ瀽 + 鐭ヨ瘑鐐?, t.includes('閿欓鍥為【') && t.includes('瑙ｆ瀽锛?) && t.includes('鐭ヨ瘑鐐癸細'), '')
await page.screenshot({ path: path.join(OUT, '15-exam-result.png') })

// 6) 鍥炲埌杩涘害椤碉細浼板垎搴斿凡鍙敤
await clickByText('瀹屾垚')
await sleep(800)
await tapTab('杩涘害')
await page.waitForFunction(() => document.body.innerText.includes('杩炵画澶╂暟'), { timeout: 20000 })
await sleep(2500)
t = await bodyText()
ok('绂诲哺绾夸及鍒嗗彲鐢紙鍑虹幇鏁板瓧鑰岄潪 鈥旓級', t.includes('褰撳墠浼板垎') && /\d+/.test((t.match(/褰撳墠浼板垎\s*\d+/) || [''])[0]), '')
await page.screenshot({ path: path.join(OUT, '16-progress-est.png') })

console.log(`\n缁撴灉: ${results.filter((r) => r.pass).length}/${results.length} 閫氳繃`)
if (errs.length) { console.log('椤甸潰閿欒:'); errs.slice(0, 8).forEach((e) => console.log('  ' + e)) } else console.log('鏃犻〉闈㈤敊璇?)
await browser.close()
process.exit(results.some((r) => !r.pass) ? 1 : 0)