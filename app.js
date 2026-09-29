const API = "https://iqpr-time-neon.vercel.app/api/v1";
const prayers = [
  { key: "fajr", name: "الفجر", sub: "Fajr", icon: "☽" },
  { key: "sunrise", name: "الشروق", sub: "Sunrise", icon: "◒" },
  { key: "dhuhr", name: "الظهر", sub: "Dhuhr", icon: "☀" },
  { key: "asr", name: "العصر", sub: "Asr", icon: "◑" },
  { key: "maghrib", name: "المغرب", sub: "Maghrib", icon: "◓" },
  { key: "isha", name: "العشاء", sub: "Isha", icon: "☾" }
];
const state = { city: localStorage.getItem("city") || "baghdad-center", times: null, date: null };
const $ = id => document.getElementById(id);
const formatDate = date => new Intl.DateTimeFormat("ar-IQ", { weekday: "long", day: "numeric", month: "long" }).format(date);
const toMinutes = time => { const [hours, minutes] = time.split(":").map(Number); return hours * 60 + minutes; };
const clockParts = () => {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Baghdad", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).formatToParts(new Date());
  return Object.fromEntries(parts.filter(part => part.type !== "literal").map(part => [part.type, Number(part.value)]));
};
const timeText = minutes => {
  const rounded = Math.round(minutes) % (24 * 60);
  return `${String(Math.floor(rounded / 60)).padStart(2, "0")}:${String(rounded % 60).padStart(2, "0")}`;
};
function updateCurrentClock() {
  const parts = clockParts();
  $("current-time").textContent = [parts.hour, parts.minute, parts.second].map(value => String(value).padStart(2, "0")).join(":");
  return parts.hour * 60 + parts.minute;
}
async function getJson(path) { const response = await fetch(`${API}${path}`); if (!response.ok) throw new Error("تعذر الاتصال بالخدمة"); return response.json(); }

function renderTimes() {
  const currentMinutes = updateCurrentClock();
  let nextIndex = prayers.findIndex(prayer => toMinutes(state.times[prayer.key]) > currentMinutes);
  if (nextIndex < 0) nextIndex = 0;
  const currentIndex = prayers.reduce((last, prayer, index) => toMinutes(state.times[prayer.key]) <= currentMinutes ? index : last, -1);
  const visibleCurrentIndex = currentIndex < 0 ? prayers.length - 1 : currentIndex;
  $("prayer-grid").innerHTML = prayers.map((prayer, index) => `
    <article class="prayer-card ${index === visibleCurrentIndex ? "active current" : ""}">
      <div class="prayer-icon">${prayer.icon}</div><h3>${prayer.name}</h3>
      <span class="prayer-sub">${prayer.sub}</span><div class="prayer-time">${state.times[prayer.key]}</div>
    </article>`).join("");
  $("next-name").textContent = prayers[nextIndex].name;
  $("next-at").textContent = state.times[prayers[nextIndex].key];
  updateCountdown(nextIndex);
  renderNightTimes();
}
function renderNightTimes() {
  const sunset = toMinutes(state.times.maghrib);
  const nextFajr = toMinutes(state.times.fajr) + 24 * 60;
  const nightLength = nextFajr - sunset;
  $("midnight-time").textContent = timeText(sunset + nightLength / 2);
  $("last-third-time").textContent = timeText(sunset + (nightLength * 2) / 3);
}
function updateCountdown(nextIndex) {
  if (!state.times) return;
  const parts = clockParts();
  const nowSeconds = parts.hour * 3600 + parts.minute * 60 + parts.second;
  const [hours, minutes] = state.times[prayers[nextIndex].key].split(":").map(Number);
  let targetSeconds = hours * 3600 + minutes * 60;
  if (targetSeconds <= nowSeconds) targetSeconds += 24 * 3600;
  const seconds = Math.max(0, targetSeconds - nowSeconds);
  $("countdown").textContent = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(n => String(n).padStart(2, "0")).join(":");
}
function populateSelect(element, items, label = "اختر المدينة") { element.innerHTML = `<option value="">${label}</option>` + items.map(item => `<option value="${item.slug}">${item.name_ar}</option>`).join(""); }
async function loadLocations() {
  const [governorates, cities] = await Promise.all([getJson("/governorates"), getJson("/cities")]);
  populateSelect($("governorate-select"), governorates.data.governorates, "كل المحافظات");
  populateSelect($("city-select"), cities.data.cities);
  const city = cities.data.cities.find(item => item.slug === state.city) || cities.data.cities.find(item => item.slug === "baghdad-center") || cities.data.cities[0];
  if (city) { state.city = city.slug; $("city-select").value = city.slug; $("governorate-select").value = city.governorate.slug; updateLocation(city); }
}
function updateLocation(city) { $("city-title").textContent = city.name_ar; $("governorate-title").textContent = city.governorate.name_ar; }
async function loadTimes() {
  $("error-message").textContent = ""; $("refresh-button").classList.add("loading");
  try { const result = await getJson(`/prayer-times/today?city=${encodeURIComponent(state.city)}`); state.times = result.data.prayer_times; state.date = result.data.date; $("gregorian-date").textContent = formatDate(new Date(`${state.date}T12:00:00`)); renderTimes(); }
  catch (error) { $("error-message").textContent = "تعذر تحميل المواقيت. تحقق من اتصال الإنترنت ثم حاول مرة أخرى."; }
  finally { $("refresh-button").classList.remove("loading"); }
}
async function filterCities(governorate) {
  try { const result = await getJson(`/cities${governorate ? `?governorate=${encodeURIComponent(governorate)}` : ""}`); populateSelect($("city-select"), result.data.cities, "اختر المدينة"); }
  catch { $("error-message").textContent = "تعذر تحميل قائمة المدن."; }
}
function setup() {
  $("hijri-date").textContent = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
  $("governorate-select").addEventListener("change", event => filterCities(event.target.value));
  $("city-select").addEventListener("change", async event => {
    if (!event.target.value) return;
    state.city = event.target.value; localStorage.setItem("city", state.city);
    try {
      const result = await getJson(`/cities?governorate=${encodeURIComponent($("governorate-select").value)}`);
      const city = result.data.cities.find(item => item.slug === state.city);
      if (city) updateLocation(city);
      loadTimes();
    } catch { $("error-message").textContent = "تعذر تغيير المدينة. حاول مرة أخرى."; }
  });
  $("refresh-button").addEventListener("click", loadTimes);
  $("theme-toggle").addEventListener("click", () => { document.body.classList.toggle("dark"); localStorage.setItem("dark", document.body.classList.contains("dark")); });
  if (localStorage.getItem("dark") === "true") document.body.classList.add("dark");
  loadLocations().then(loadTimes).catch(() => { $("error-message").textContent = "تعذر تحميل المدن. تحقق من اتصال الإنترنت ثم حاول مرة أخرى."; });
  setInterval(() => state.times && renderTimes(), 1000);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
}
setup();
