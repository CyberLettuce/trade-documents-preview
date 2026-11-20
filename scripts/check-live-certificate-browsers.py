"""Smoke-test both live sample workspaces in an isolated browser session."""
import re
import sys

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait


BASE = "https://cyberlettuce.github.io/trade-documents-preview/"
RELEASE = "2026-11-20-certificate-review-r1"


def start_browser(name):
    if name == "Safari":
        return webdriver.Safari()
    options = getattr(webdriver, name + "Options")()
    options.add_argument("-headless" if name == "Firefox" else "--headless=new")
    return getattr(webdriver, name)(options=options)


SEED = """
const react = arguments[0], expected = arguments[1];
if (document.querySelector('meta[name="application-version"]')?.content !== expected) return false;
const key = react ? 'ecert-chamber-preview-v1' : 'trade-documents-vue-comparison-v1';
const workspace = JSON.parse(localStorage.getItem(key) || 'null');
const records = react ? workspace?.apps : workspace?.records;
const sample = records?.find(record => record.id === (react ? 'ch-app-0' : 'sample-0'));
if (!sample) return false;
const names = {coo:'UK Certificate of Origin', eur:'EUR1', arab:'Arab Certificate of Origin'};
for (const doc of Object.keys(names)) {
  const id = 'live-browser-check-' + doc;
  if (records.some(record => record.id === id)) continue;
  const record = {...sample,id,certificate:'',issueDate:'',stampDate:'',status:'Pending',
    applicantSignatory:'Browser check applicant',applicantEmail:'browser-check@example.com'};
  Object.assign(record, react ? {docs:[doc],assigned:'',lockedBy:''} :
    {document:names[doc],documents:[names[doc]],owner:''});
  records.push(record);
}
localStorage.setItem(key, JSON.stringify(workspace));
return true;
"""


def details_visible(driver):
    panels = driver.find_elements(By.CSS_SELECTOR, ".certificate-application-columns")
    return panels[0] if panels and panels[0].is_displayed() else False


def check_workspace(driver, react):
    entry = BASE if react else BASE + "vue/"
    route = "#chamber/applications/Pending/" if react else "#/chamber/applications/"
    wait = WebDriverWait(driver, 25)
    driver.get(entry + (route.rstrip("/") if react else "#/chamber/applications"))
    wait.until(lambda browser: browser.execute_script(SEED, react, RELEASE))

    for doc, pattern, date_labels, invalid, message in [
        ("coo", r"[a-z0-9]{10}", ("Issue Date", "Stamp Date"), None, None),
        ("eur", r"[a-z]\d{7,8}", ("Box 12 Date", "Box 11 Date"), "A123456", "1 letter followed by 7 to 8 digits"),
        ("arab", r"[a-z]{1,2}\d{6,9}", (), "ABC123456", "1 or 2 letters followed by 6 to 9 digits"),
    ]:
        url = entry + "?cloud-browser-check=" + doc + route + "live-browser-check-" + doc
        driver.get(url)
        panel = wait.until(details_visible)
        link = panel.find_element(By.CSS_SELECTOR, 'a[href="mailto:browser-check@example.com"]')
        assert link.is_displayed(), doc
        number_id = "review-certificate" if doc == "coo" else "review-certificate-" + doc
        number = panel.find_element(By.ID, number_id)
        value = number.text if doc == "coo" else number.get_property("value")
        assert re.fullmatch(pattern, value), (doc, value)
        wait.until(lambda browser: value in browser.find_element(
            By.CSS_SELECTOR, "#pack-document-preview .certificate-" + doc).text)
        today = driver.execute_script(
            "const d=new Date(); return [d.getFullYear(),d.getMonth()+1,d.getDate()]"
            ".map(n=>String(n).padStart(2,'0')).join('-');"
        )
        for label in date_labels:
            picker = panel.find_element(By.CSS_SELECTOR, f'input[type="date"][aria-label="{label}"]')
            assert picker.get_property("value") == today, (doc, label)
        if invalid:
            number.send_keys(Keys.HOME, Keys.SHIFT, Keys.END, Keys.NULL, Keys.BACKSPACE)
            number.send_keys(invalid, Keys.TAB)
            wait.until(lambda browser: message in browser.find_element(By.ID, number_id + "-error").text)

    for width in (320, 390):
        url = entry + "?cloud-responsive-check=" + str(width) + route + "live-browser-check-coo"
        frame = driver.execute_script("""
          const frame = document.createElement('iframe');
          frame.src = arguments[0];
          frame.style.cssText = 'position:fixed;inset:0;z-index:2147483647;height:844px;border:none;';
          frame.width = arguments[1];
          document.body.append(frame);
          return frame;
        """, url, width)
        try:
            driver.switch_to.frame(frame)
            wait.until(details_visible)
            wait.until(lambda browser: browser.execute_script("""
              const [details, processing] = document.querySelector('.certificate-application-columns').children;
              const a = details.getBoundingClientRect(), b = processing.getBoundingClientRect();
              return innerWidth === arguments[0] && document.documentElement.scrollWidth <= innerWidth + 2
                && Math.abs(a.x - b.x) < 3 && b.y >= a.bottom;
            """, width))
        finally:
            driver.switch_to.default_content()
            driver.execute_script("arguments[0].remove()", frame)
    print(f'{"React" if react else "Vue"} passed certificate checks and 320/390 px responsive checks.', flush=True)


browser_name = sys.argv[1]
with start_browser(browser_name) as browser:
    caps = browser.capabilities
    print(f'{caps["browserName"]} {caps["browserVersion"]}', flush=True)
    browser.set_window_size(1440, 900)
    for is_react in (True, False):
        check_workspace(browser, is_react)
