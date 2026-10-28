
if (new URLSearchParams(location.search).get('preview') !== '1') location.replace('/event-gtmc');
var data = { name: 'Aarav Sanjay Deshmukh', prn: '2400123456', branch: 'Computer Science', year: 'Second Year', certificate_id: 'SWY26-PREVIEW1' };
var $ = function (id) { return document.getElementById(id); };
function draw() { GtmcCert.render($('preview'), data, true); }
var map = { eName: 'name', ePrn: 'prn', eBranch: 'branch', eYear: 'year' };
Object.keys(map).forEach(function (id) { $(id).value = data[map[id]]; $(id).oninput = function () { data[map[id]] = this.value || ' '; draw(); }; });
$('pngBtn').onclick = function () { GtmcCert.png(data, true); };
$('pdfBtn').onclick = function () { GtmcCert.pdf(data, true).catch(function () { alert('PDF tool load नहीं हुआ।'); }); };
draw();
