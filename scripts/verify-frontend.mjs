import fs from 'node:fs/promises'
const base = process.env.VERIFY_URL || 'http://localhost:5173'
const port = process.env.VERIFY_CDP_PORT || '9235'
const artifacts = 'node_modules/.cache/fixth-verification'
await fs.mkdir(artifacts, { recursive: true })
const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
const ws = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl)
await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }) })
let id = 0
const pending = new Map()
const exceptions = []
ws.addEventListener('message', event => {
  const result = JSON.parse(event.data)
  if (result.method === 'Runtime.exceptionThrown') exceptions.push(result.params.exceptionDetails)
  if (result.id) { const p = pending.get(result.id); if (!p) return; pending.delete(result.id); clearTimeout(p.timer); if (result.error) p.reject(result.error); else p.resolve(result.result) }
})
function cdp(method, params = {}) { return new Promise((resolve, reject) => { const key = ++id; const timer = setTimeout(() => { pending.delete(key); reject(new Error(`Timed out: ${method}`)) }, 15000); pending.set(key, { resolve, reject, timer }); ws.send(JSON.stringify({ id: key, method, params })) }) }
async function evaluate(expression) { const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value }
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
function assert(ok, message) { if (!ok) throw new Error(message) }
async function waitFor(expression) { for (let n = 0; n < 70; n++) { await pause(100); try { if (await evaluate(expression)) return } catch { /* A navigation can invalidate an evaluation context. */ } } throw new Error('Condition failed: ' + expression) }
async function navigate(path) { await cdp('Page.navigate', { url: base + path }); await waitFor(`document.querySelector('main') && document.readyState === 'complete' && location.pathname === ${JSON.stringify(path.split('?')[0])}`) }
async function click(text, selector = 'button,a') { await waitFor(`!![...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.getClientRects().length && e.textContent.trim() === ${JSON.stringify(text)})`); const result = await evaluate(`(() => { const e = [...document.querySelectorAll(${JSON.stringify(selector)})].find(e => e.getClientRects().length && e.textContent.trim() === ${JSON.stringify(text)}); if (!e) return false; e.focus(); e.click(); return true })()`); assert(result, `Control not found: ${text}`); await pause(100) }
async function fill(selector, value) { if (selector.startsWith('[name=')) selector = 'form ' + selector; await evaluate(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) throw new Error('Missing field: ${selector}'); const proto = e.tagName === 'SELECT' ? HTMLSelectElement.prototype : e.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)}); e.dispatchEvent(new Event(e.tagName === 'SELECT' ? 'change' : 'input',{bubbles:true})); })()`); await pause(30) }
async function submit() { assert(await evaluate('document.querySelector("form").checkValidity()'), 'Form invalid'); await evaluate('document.querySelector("form").requestSubmit()'); await pause(100) }
async function screenshot(name) { await evaluate('document.fonts.ready'); const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); await fs.writeFile(`${artifacts}/${name}.png`, Buffer.from(shot.data, 'base64')) }
await cdp('Runtime.enable')
await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false })
await navigate('/workspaces')
await evaluate('sessionStorage.clear()')
await navigate('/onboarding/organization/email')
await screenshot('onboarding-desktop')
await evaluate('document.querySelector("form").requestSubmit()')
assert(await evaluate('!!document.querySelector("[aria-invalid=true]")'), 'Missing inline validation')
for (const track of ['organization', 'student']) {
  await navigate(`/onboarding/${track}/email`)
  const slugs = track === 'organization' ? ['email','code','details','story','review'] : ['email','code','about','education','preferences','skills','review']
  for (const slug of slugs) {
    await waitFor(`location.pathname.endsWith('/${slug}')`)
    if (slug === 'code') {
      assert(await evaluate('document.querySelectorAll(".auth-otp input").length === 6'), 'Six OTP cells missing')
      await evaluate(`(() => { const input = document.querySelector('.auth-otp input'); const data = new DataTransfer(); data.setData('text/plain','482716'); input.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,clipboardData:data})); })()`)
      assert(await evaluate('[...document.querySelectorAll(".auth-otp input")].map(e=>e.value).join("") === "482716"'), 'OTP paste failed')
    } else {
      const fields = await evaluate('[...document.querySelectorAll("form input:not([type=file]):not([type=search]),form textarea,form select")].map(e=>({name:e.name,type:e.type,tag:e.tagName,option:e.tagName==="SELECT"?e.options[1].value:null}))')
      for (const f of fields) { const values = { course: 'Computer Engineering', firstName: 'Ayo', lastName: 'Ogun', organization: 'Nova Labs', location: 'Lagos', country: 'Nigeria', city: 'Lagos', website: 'novalabs.africa' }; await fill(`[name="${f.name}"]`, f.tag === 'SELECT' ? f.name === 'level' ? '400 level' : f.option : f.type === 'email' ? 'test@university.edu.ng' : f.type === 'date' ? '2027-04-12' : f.type === 'tel' ? '+2348012345678' : values[f.name] || 'Test value') }
    }
    if (slug === 'skills') await evaluate('document.querySelector(".auth-skills button").click()')
    await submit()
  }
  await waitFor('location.pathname.endsWith("/complete")')
  assert(await evaluate('!![...document.querySelectorAll("a")].find(a=>a.textContent === "Continue to placements")'), 'Workspace connection missing')
  console.log(`PASS ${track} onboarding, native validation, paste, and completion links`)
}
await navigate('/student/discover')
await evaluate('document.querySelector("button[aria-label^=Save]").click()')
await navigate('/student/saved')
assert(await evaluate('document.querySelectorAll(".p-placement-card").length===1'), 'Saved placement missing')
await navigate('/student/discover')
await fill('input[type=search]', 'no-such-placement')
assert(await evaluate('document.body.innerText.includes("No matching placements")'), 'Search empty state missing')
await navigate('/student/resume')
await evaluate(`(() => { const input = document.querySelector('input[type=file]'); const files = new DataTransfer(); files.items.add(new File(['%PDF-1.4 preview'], 'Ayo-Resume.pdf', {type:'application/pdf'})); input.files=files.files; input.dispatchEvent(new Event('change',{bubbles:true})); })()`)
await click('Discover', '.p-sidebar a')
await click('Frontend Engineering Intern', '.p-placement-card a')
await click('Apply with Fixth profile')
assert(await evaluate('document.querySelector("dialog").open'), 'Apply dialog not open')
await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
await pause(100)
assert(await evaluate('!document.querySelector("dialog")'), 'Escape did not close dialog')
assert(await evaluate('document.activeElement.textContent.includes("Apply with Fixth profile")'), 'Dialog focus not restored')
await click('Apply with Fixth profile')
await click('Confirm application')
await navigate('/student/applications')
assert(await evaluate('document.body.innerText.includes("Frontend Engineering Intern")'), 'Application missing')
console.log('PASS saved placements, search empty state, resume selection, application, dialog Escape and focus restoration')
await navigate('/company/placements/new')
for (const [name, value] of Object.entries({ title:'Test Engineering Placement', location:'Lagos', discipline:'Computer Engineering', duration:'6 months', stipend:'₦180,000', description:'An accessible product engineering placement.', responsibilities:'Build, test, and learn alongside mentors.', requirements:'JavaScript foundations and curiosity.' })) await fill(`[name="${name}"]`, value)
await submit()
await waitFor('location.pathname==="/company/placements"')
assert(await evaluate('document.body.innerText.includes("Test Engineering Placement")'), 'Publishing failed')
await navigate('/student/discover')
assert(await evaluate('document.body.innerText.includes("Test Engineering Placement")'), 'Published placement not discoverable')
await navigate('/company/applicants')
await click('Review Ayo Ogun', 'a')
await click('Accept')
assert(await evaluate('document.querySelector(".p-badge").textContent.length>0 && document.body.innerText.includes("Accepted")'), 'Applicant decision failed')
console.log('PASS placement publishing and applicant decisions')
await navigate('/p/meta-product-design')
await evaluate(`Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__copiedLink=value}}})`)
await click('Copy link', '.p-apply-panel button')
assert(await evaluate('window.__copiedLink.endsWith("/p/meta-product-design")'), 'Incorrect canonical clipboard URL')
assert(await evaluate('document.activeElement.textContent === "Copied"'), 'Copy moved focus')
await evaluate(`Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Permission denied')}}}); document.execCommand=()=>false`)
await click('Copied', '.p-apply-panel button')
assert(await evaluate('!!document.querySelector(".p-copy input[readonly]")'), 'Manual copy fallback not exposed')
console.log('PASS canonical copy success, failure fallback and focus preservation')
await navigate('/admin/verification/student/c-1')
await fill('textarea[name=reason]', 'Identity documents match the submitted profile.')
await submit()
await navigate('/admin/audit')
assert(await evaluate('document.body.innerText.includes("Approve verification")'), 'Audit entry missing')
await navigate('/admin/listings')
await click('Unpublish')
await fill('dialog textarea[name=reason]', 'Listing requires an additional company review.')
await submit()
await navigate('/p/google-fe-intern')
assert(await evaluate('document.body.innerText.includes("Placement unavailable")'), 'Unpublished placement still accessible')
await navigate('/admin/accounts')
await click('Suspend')
await fill('dialog textarea[name=reason]', 'Repeated policy reports require further review.')
await submit()
assert(await evaluate('document.body.innerText.includes("Suspended")'), 'Account suspension failed')
console.log('PASS verification reasons, audit log, unpublish visibility, account suspension')
await navigate('/workspaces')
await evaluate('sessionStorage.clear()')
const routes = ['/workspaces','/auth/sign-in','/auth/forgot-password','/onboarding/organization/email','/onboarding/organization/code','/onboarding/organization/details','/onboarding/organization/story','/onboarding/organization/review','/onboarding/student/about','/onboarding/student/education','/onboarding/student/preferences','/onboarding/student/skills','/student/discover','/student/saved','/student/applications','/p/meta-product-design','/student/profile','/student/profile/edit','/student/resume','/company/placements','/company/placements/new','/company/placements/pl-6/edit','/company/applicants','/company/placements/pl-6/applicants/c-1','/company/profile','/admin/verification','/admin/verification/student/c-1','/admin/verification/company/nova','/admin/listings','/admin/accounts','/admin/audit']
for (const [width,height] of [[1440,1024],[1280,720],[720,512],[390,844],[320,640]]) {
  await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width < 600})
  for (const path of routes) {
    await navigate(path)
    const dimensions = await evaluate('({overflow:document.documentElement.scrollWidth>innerWidth+1,mains:document.querySelectorAll("main").length,headings:document.querySelectorAll("h1").length,clipped:[...document.querySelectorAll("main,.p-panel,.p-placement-card")].filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>({class:e.className,w:e.clientWidth,scroll:e.scrollWidth}))})')
    assert(!dimensions.overflow, `${width}px page overflow at ${path}`)
    assert(dimensions.mains === 1 && dimensions.headings === 1, `Landmarks/headings at ${path}: ${JSON.stringify(dimensions)}`)
    assert(!dimensions.clipped.length, `${width}px clipped content at ${path}: ${JSON.stringify(dimensions.clipped)}`)
  }
  console.log(`PASS ${routes.length} screens at ${width}×${height}, including reflow equivalent to 200% zoom of a 1440px window`)
  if (width===1440 || width===390) for (const [path,name] of [['/student/discover','discover'],['/student/profile','profile'],['/company/placements','company'],['/admin/verification','admin'],['/onboarding/organization/email','onboarding']]) { await navigate(path); await screenshot(`${name}-${width}`) }
}
assert(exceptions.length===0,'Uncaught browser errors: '+JSON.stringify(exceptions))
console.log('PASS no uncaught browser exceptions')
await cdp('Runtime.enable')
await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1024,deviceScaleFactor:1,mobile:false})
await navigate('/student/profile/edit')
await fill('form [name=firstName]', 'Alexandria'.repeat(18))
await fill('form [name=lastName]', 'Oluwaseun'.repeat(12))
await submit()
await waitFor('location.pathname === "/student/profile"')
assert(await evaluate('document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll("header,main,.p-panel")].every(e=>e.scrollWidth<=e.clientWidth+2)'), 'Long name causes clipped content')
console.log('PASS long profile names reflow without clipping')
for (const [width,height] of [[1440,960],[320,640]]) {
 await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600})
 for (const path of ['/onboarding/organization/email','/onboarding/organization/story','/student/profile','/company/placements','/admin/verification']) {
  await navigate(path)
  await evaluate('(() => { const entries=[...document.querySelectorAll("body *:not(svg):not(svg *)")].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]); for(const [e,size] of entries) e.style.fontSize=(size*2)+"px"; })()')
  assert(await evaluate('document.documentElement.scrollWidth <= innerWidth+1'), 'Text enlargement overflow: '+width+' '+path)
  assert(await evaluate('[...document.querySelectorAll("main,.p-panel,.auth-content")].every(e=>e.scrollWidth<=e.clientWidth+2)'), 'Text enlargement clips content: '+width+' '+path)
 }
 console.log('PASS 200% text enlargement at '+width+'px')
}
await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true})
await navigate('/student/discover')
await click('Location','.p-mobile-filter-buttons button')
assert(await evaluate('document.querySelector("dialog").open'),'Mobile filter did not open')
await evaluate('document.querySelector("dialog button:last-child").focus()')
await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9})
await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9})
assert(await evaluate('document.querySelector("dialog").contains(document.activeElement)'),'Dialog focus escaped')
await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27})
await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27})
await pause(100)
assert(await evaluate('!document.querySelector("dialog")'),'Mobile filter Escape failed')
await navigate('/onboarding/organization/email')
assert(await evaluate('!performance.getEntriesByType("resource").some(e=>e.name.includes("brand-panel") && e.initiatorType === "img")'),'Mobile downloads hidden artwork')
assert(await evaluate('parseFloat(getComputedStyle(document.querySelector("input")).fontSize)>=16'),'Mobile input below 16px')
console.log('PASS mobile filters, keyboard focus containment, 16px inputs, no hidden desktop artwork download')
assert(!exceptions.length,'Uncaught browser exception')

ws.close()






