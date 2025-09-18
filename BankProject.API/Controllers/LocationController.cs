using Microsoft.AspNetCore.Mvc;

namespace BankProject.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LocationController : ControllerBase
    {
        private static readonly List<CityData> CitiesData = new List<CityData>
        {
            new CityData { Name = "Adana", Districts = new[] { "Aladağ", "Ceyhan", "Çukurova", "Feke", "İmamoğlu", "Karaisalı", "Karataş", "Kozan", "Pozantı", "Saimbeyli", "Sarıçam", "Seyhan", "Tufanbeyli", "Yumurtalık", "Yüreğir" } },
            new CityData { Name = "Adıyaman", Districts = new[] { "Besni", "Çelikhan", "Gerger", "Gölbaşı", "Kahta", "Merkez", "Samsat", "Sincik", "Tut" } },
            new CityData { Name = "Afyonkarahisar", Districts = new[] { "Başmakçı", "Bayat", "Bolvadin", "Çay", "Çobanlar", "Dazkırı", "Dinar", "Emirdağ", "Evciler", "Hocalar", "İhsaniye", "İscehisar", "Kızılören", "Merkez", "Sandıklı", "Sinanpaşa", "Sultandağı", "Şuhut" } },
            new CityData { Name = "Ağrı", Districts = new[] { "Diyadin", "Doğubayazıt", "Eleşkirt", "Hamur", "Merkez", "Patnos", "Taşlıçay", "Tutak" } },
            new CityData { Name = "Amasya", Districts = new[] { "Göynücek", "Gümüşhacıköy", "Hamamözü", "Merkez", "Merzifon", "Suluova", "Taşova" } },
            new CityData { Name = "Ankara", Districts = new[] { "Altındağ", "Ayaş", "Bala", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Güdül", "Haymana", "Kalecik", "Kızılcahamam", "Nallıhan", "Polatlı", "Şereflikoçhisar", "Yenimahalle", "Gölbaşı", "Keçiören", "Mamak", "Sincan", "Kazan", "Akyurt", "Etimesgut", "Evren", "Pursaklar" } },
            new CityData { Name = "Antalya", Districts = new[] { "Akseki", "Alanya", "Elmalı", "Finike", "Gazipaşa", "Gündoğmuş", "Kaş", "Korkuteli", "Kumluca", "Manavgat", "Serik", "Demre", "İbradı", "Kemer", "Aksu", "Döşemealtı", "Kepez", "Konyaaltı", "Muratpaşa" } },
            new CityData { Name = "Artvin", Districts = new[] { "Ardanuç", "Arhavi", "Merkez", "Borçka", "Hopa", "Şavşat", "Yusufeli", "Murgul" } },
            new CityData { Name = "Aydın", Districts = new[] { "Merkez", "Bozdoğan", "Efeler", "Çine", "Germencik", "Karacasu", "Koçarlı", "Kuşadası", "Kuyucak", "Nazilli", "Söke", "Sultanhisar", "Yenipazar", "Buharkent", "İncirliova", "Karpuzlu", "Köşk", "Didim" } },
            new CityData { Name = "Balıkesir", Districts = new[] { "Altıeylül", "Ayvalık", "Merkez", "Balya", "Bandırma", "Bigadiç", "Burhaniye", "Dursunbey", "Edremit", "Erdek", "Gönen", "Havran", "İvrindi", "Karesi", "Kepsut", "Manyas", "Savaştepe", "Sındırgı", "Gömeç", "Susurluk", "Marmara" } },
            new CityData { Name = "Bilecik", Districts = new[] { "Merkez", "Bozüyük", "Gölpazarı", "Osmaneli", "Pazaryeri", "Söğüt", "Yenipazar", "İnhisar" } },
            new CityData { Name = "Bingöl", Districts = new[] { "Merkez", "Genç", "Karlıova", "Kiğı", "Solhan", "Adaklı", "Yayladere", "Yedisu" } },
            new CityData { Name = "Bitlis", Districts = new[] { "Adilcevaz", "Ahlat", "Merkez", "Hizan", "Mutki", "Tatvan", "Güroymak" } },
            new CityData { Name = "Bolu", Districts = new[] { "Merkez", "Gerede", "Göynük", "Kıbrıscık", "Mengen", "Mudurnu", "Seben", "Dörtdivan", "Yeniçağa" } },
            new CityData { Name = "Burdur", Districts = new[] { "Ağlasun", "Bucak", "Merkez", "Gölhisar", "Tefenni", "Yeşilova", "Karamanlı", "Kemer", "Altınyayla", "Çavdır", "Çeltikçi" } },
            new CityData { Name = "Bursa", Districts = new[] { "Gemlik", "İnegöl", "İznik", "Karacabey", "Keles", "Mudanya", "Mustafakemalpaşa", "Orhaneli", "Orhangazi", "Yenişehir", "Büyükorhan", "Harmancık", "Nilüfer", "Osmangazi", "Yıldırım", "Gürsu", "Kestel" } },
            new CityData { Name = "Çanakkale", Districts = new[] { "Ayvacık", "Bayramiç", "Biga", "Bozcaada", "Çan", "Merkez", "Eceabat", "Ezine", "Gelibolu", "Gökçeada", "Lapseki", "Yenice" } },
            new CityData { Name = "Çankırı", Districts = new[] { "Merkez", "Çerkeş", "Eldivan", "Ilgaz", "Kurşunlu", "Orta", "Şabanözü", "Yapraklı", "Atkaracalar", "Kızılırmak", "Bayramören", "Korgun" } },
            new CityData { Name = "Çorum", Districts = new[] { "Alaca", "Bayat", "Merkez", "İskilip", "Kargı", "Mecitözü", "Ortaköy", "Osmancık", "Sungurlu", "Boğazkale", "Uğurludağ", "Dodurga", "Laçin", "Oğuzlar" } },
            new CityData { Name = "Denizli", Districts = new[] { "Acıpayam", "Buldan", "Çal", "Çameli", "Çardak", "Çivril", "Merkez", "Merkezefendi", "Pamukkale", "Güney", "Kale", "Sarayköy", "Tavas", "Babadağ", "Bekilli", "Honaz", "Serinhisar", "Baklan", "Beyağaç", "Bozkurt" } },
            new CityData { Name = "Diyarbakır", Districts = new[] { "Kocaköy", "Çermik", "Çınar", "Çüngüş", "Dicle", "Ergani", "Hani", "Hazro", "Kulp", "Lice", "Silvan", "Eğil", "Bağlar", "Kayapınar", "Sur", "Yenişehir", "Bismil" } },
            new CityData { Name = "Edirne", Districts = new[] { "Merkez", "Enez", "Havsa", "İpsala", "Keşan", "Lalapaşa", "Meriç", "Uzunköprü", "Süloğlu" } },
            new CityData { Name = "Elazığ", Districts = new[] { "Ağın", "Baskil", "Merkez", "Karakoçan", "Keban", "Maden", "Palu", "Sivrice", "Arıcak", "Kovancılar", "Alacakaya" } },
            new CityData { Name = "Erzincan", Districts = new[] { "Çayırlı", "Merkez", "İliç", "Kemah", "Kemaliye", "Refahiye", "Tercan", "Üzümlü", "Otlukbeli" } },
            new CityData { Name = "Erzurum", Districts = new[] { "Aşkale", "Çat", "Hınıs", "Horasan", "İspir", "Karayazı", "Narman", "Oltu", "Olur", "Pasinler", "Şenkaya", "Tekman", "Tortum", "Karaçoban", "Uzundere", "Pazaryolu", "Köprüköy", "Palandöken", "Yakutiye", "Aziziye" } },
            new CityData { Name = "Eskişehir", Districts = new[] { "Çifteler", "Mahmudiye", "Mihalıççık", "Sarıcakaya", "Seyitgazi", "Sivrihisar", "Alpu", "Beylikova", "İnönü", "Günyüzü", "Han", "Mihalgazi", "Odunpazarı", "Tepebaşı" } },
            new CityData { Name = "Gaziantep", Districts = new[] { "Araban", "İslahiye", "Nizip", "Oğuzeli", "Yavuzeli", "Şahinbey", "Şehitkamil", "Karkamış", "Nurdağı" } },
            new CityData { Name = "Giresun", Districts = new[] { "Alucra", "Bulancak", "Dereli", "Espiye", "Eynesil", "Merkez", "Görele", "Keşap", "Şebinkarahisar", "Tirebolu", "Piraziz", "Yağlıdere", "Çamoluk", "Çanakçı", "Doğankent", "Güce" } },
            new CityData { Name = "Gümüşhane", Districts = new[] { "Merkez", "Kelkit", "Şiran", "Torul", "Köse", "Kürtün" } },
            new CityData { Name = "Hakkari", Districts = new[] { "Çukurca", "Merkez", "Şemdinli", "Yüksekova" } },
            new CityData { Name = "Hatay", Districts = new[] { "Altınözü", "Arsuz", "Defne", "Dörtyol", "Hassa", "Antakya", "İskenderun", "Kırıkhan", "Payas", "Reyhanlı", "Samandağ", "Yayladağı", "Erzin", "Belen", "Kumlu" } },
            new CityData { Name = "Isparta", Districts = new[] { "Atabey", "Eğirdir", "Gelendost", "Merkez", "Keçiborlu", "Senirkent", "Sütçüler", "Şarkikaraağaç", "Uluborlu", "Yalvaç", "Aksu", "Gönen", "Yenişarbademli" } },
            new CityData { Name = "Mersin", Districts = new[] { "Anamur", "Erdemli", "Gülnar", "Mut", "Silifke", "Tarsus", "Aydıncık", "Bozyazı", "Çamlıyayla", "Akdeniz", "Mezitli", "Toroslar", "Yenişehir" } },
            new CityData { Name = "İstanbul", Districts = new[] { "Adalar", "Bakırköy", "Beşiktaş", "Beykoz", "Beyoğlu", "Çatalca", "Eyüp", "Fatih", "Gaziosmanpaşa", "Kadıköy", "Kartal", "Sarıyer", "Silivri", "Şile", "Şişli", "Üsküdar", "Zeytinburnu", "Büyükçekmece", "Kağıthane", "Küçükçekmece", "Pendik", "Ümraniye", "Bayrampaşa", "Avcılar", "Bağcılar", "Bahçelievler", "Güngören", "Maltepe", "Sultanbeyli", "Tuzla", "Esenler", "Arnavutköy", "Ataşehir", "Başakşehir", "Beylikdüzü", "Çekmeköy", "Esenyurt", "Sancaktepe", "Sultangazi" } },
            new CityData { Name = "İzmir", Districts = new[] { "Aliağa", "Bayındır", "Bergama", "Bornova", "Çeşme", "Dikili", "Foça", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz", "Menemen", "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla", "Beydağ", "Buca", "Konak", "Menderes", "Balçova", "Çiğli", "Gaziemir", "Narlıdere", "Güzelbahçe", "Bayraklı", "Karabağlar" } },
            new CityData { Name = "Kars", Districts = new[] { "Arpaçay", "Digor", "Kağızman", "Merkez", "Sarıkamış", "Selim", "Susuz", "Akyaka" } },
            new CityData { Name = "Kastamonu", Districts = new[] { "Abana", "Araç", "Azdavay", "Bozkurt", "Cide", "Çatalzeytin", "Daday", "Devrekani", "İnebolu", "Merkez", "Küre", "Taşköprü", "Tosya", "İhsangazi", "Pınarbaşı", "Şenpazar", "Ağlı", "Doğanyurt", "Hanönü", "Seydiler" } },
            new CityData { Name = "Kayseri", Districts = new[] { "Bünyan", "Develi", "Felahiye", "İncesu", "Pınarbaşı", "Sarıoğlan", "Sarız", "Tomarza", "Yahyalı", "Yeşilhisar", "Akkışla", "Talas", "Kocasinan", "Melikgazi", "Hacılar", "Özvatan" } },
            new CityData { Name = "Kırklareli", Districts = new[] { "Babaeski", "Demirköy", "Merkez", "Kofçaz", "Lüleburgaz", "Pehlivanköy", "Pınarhisar", "Vize" } },
            new CityData { Name = "Kırşehir", Districts = new[] { "Çiçekdağı", "Kaman", "Merkez", "Mucur", "Akpınar", "Akçakent", "Boztepe" } },
            new CityData { Name = "Kocaeli", Districts = new[] { "Gebze", "Gölcük", "Kandıra", "Karamürsel", "Körfez", "Derince", "Başiskele", "Çayırova", "Darıca", "Dilovası", "İzmit", "Kartepe" } },
            new CityData { Name = "Konya", Districts = new[] { "Akşehir", "Beyşehir", "Bozkır", "Cihanbeyli", "Çumra", "Doğanhisar", "Ereğli", "Hadim", "Ilgın", "Kadınhanı", "Karapınar", "Kulu", "Sarayönü", "Seydişehir", "Yunak", "Akören", "Altınekin", "Derebucak", "Hüyük", "Karatay", "Meram", "Selçuklu", "Taşkent", "Ahırlı", "Çeltik", "Derbent", "Emirgazi", "Güneysınır", "Halkapınar", "Tuzlukçu", "Yalıhüyük" } },
            new CityData { Name = "Kütahya", Districts = new[] { "Altıntaş", "Domaniç", "Emet", "Gediz", "Merkez", "Simav", "Tavşanlı", "Aslanapa", "Dumlupınar", "Hisarcık", "Şaphane", "Çavdarhisar", "Pazarlar" } },
            new CityData { Name = "Malatya", Districts = new[] { "Akçadağ", "Arapgir", "Arguvan", "Darende", "Doğanşehir", "Hekimhan", "Merkez", "Pütürge", "Yeşilyurt", "Battalgazi", "Doğanyol", "Kale", "Kuluncak", "Yazıhan" } },
            new CityData { Name = "Manisa", Districts = new[] { "Akhisar", "Alaşehir", "Demirci", "Gördes", "Kırkağaç", "Kula", "Merkez", "Salihli", "Sarıgöl", "Saruhanlı", "Selendi", "Soma", "Şehzadeler", "Yunusemre", "Turgutlu", "Ahmetli", "Gölmarmara", "Köprübaşı" } },
            new CityData { Name = "Kahramanmaraş", Districts = new[] { "Afşin", "Andırın", "Dulkadiroğlu", "Onikişubat", "Elbistan", "Göksun", "Merkez", "Pazarcık", "Türkoğlu", "Çağlayancerit", "Ekinözü", "Nurhak" } },
            new CityData { Name = "Mardin", Districts = new[] { "Derik", "Kızıltepe", "Artuklu", "Merkez", "Mazıdağı", "Midyat", "Nusaybin", "Ömerli", "Savur", "Dargeçit", "Yeşilli" } },
            new CityData { Name = "Muğla", Districts = new[] { "Bodrum", "Datça", "Fethiye", "Köyceğiz", "Marmaris", "Menteşe", "Milas", "Ula", "Yatağan", "Dalaman", "Seydikemer", "Ortaca", "Kavaklıdere" } },
            new CityData { Name = "Muş", Districts = new[] { "Bulanık", "Malazgirt", "Merkez", "Varto", "Hasköy", "Korkut" } },
            new CityData { Name = "Nevşehir", Districts = new[] { "Avanos", "Derinkuyu", "Gülşehir", "Hacıbektaş", "Kozaklı", "Merkez", "Ürgüp", "Acıgöl" } },
            new CityData { Name = "Niğde", Districts = new[] { "Bor", "Çamardı", "Merkez", "Ulukışla", "Altunhisar", "Çiftlik" } },
            new CityData { Name = "Ordu", Districts = new[] { "Akkuş", "Altınordu", "Aybastı", "Fatsa", "Gölköy", "Korgan", "Kumru", "Mesudiye", "Perşembe", "Ulubey", "Ünye", "Gülyalı", "Gürgentepe", "Çamaş", "Çatalpınar", "Çaybaşı", "İkizce", "Kabadüz", "Kabataş" } },
            new CityData { Name = "Rize", Districts = new[] { "Ardeşen", "Çamlıhemşin", "Çayeli", "Fındıklı", "İkizdere", "Kalkandere", "Pazar", "Merkez", "Güneysu", "Derepazarı", "Hemşin", "İyidere" } },
            new CityData { Name = "Sakarya", Districts = new[] { "Akyazı", "Geyve", "Hendek", "Karasu", "Kaynarca", "Sapanca", "Kocaali", "Pamukova", "Taraklı", "Ferizli", "Karapürçek", "Söğütlü", "Adapazarı", "Arifiye", "Erenler", "Serdivan" } },
            new CityData { Name = "Samsun", Districts = new[] { "Alaçam", "Bafra", "Çarşamba", "Havza", "Kavak", "Ladik", "Terme", "Vezirköprü", "Asarcık", "Ondokuzmayıs", "Salıpazarı", "Tekkeköy", "Ayvacık", "Yakakent", "Atakum", "Canik", "İlkadım" } },
            new CityData { Name = "Siirt", Districts = new[] { "Baykan", "Eruh", "Kurtalan", "Pervari", "Merkez", "Şirvan", "Tillo" } },
            new CityData { Name = "Sinop", Districts = new[] { "Ayancık", "Boyabat", "Durağan", "Erfelek", "Gerze", "Merkez", "Türkeli", "Dikmen", "Saraydüzü" } },
            new CityData { Name = "Sivas", Districts = new[] { "Divriği", "Gemerek", "Gürün", "Hafik", "İmranlı", "Kangal", "Koyulhisar", "Merkez", "Suşehri", "Şarkışla", "Yıldızeli", "Zara", "Akıncılar", "Altınyayla", "Doğanşar", "Gölova", "Ulaş" } },
            new CityData { Name = "Tekirdağ", Districts = new[] { "Çerkezköy", "Çorlu", "Ergene", "Hayrabolu", "Malkara", "Muratlı", "Saray", "Süleymanpaşa", "Kapaklı", "Şarköy", "Marmaraereğlisi" } },
            new CityData { Name = "Tokat", Districts = new[] { "Almus", "Artova", "Erbaa", "Niksar", "Reşadiye", "Merkez", "Turhal", "Zile", "Pazar", "Yeşilyurt", "Başçiftlik", "Sulusaray" } },
            new CityData { Name = "Trabzon", Districts = new[] { "Akçaabat", "Araklı", "Arsin", "Çaykara", "Maçka", "Of", "Ortahisar", "Sürmene", "Tonya", "Vakfıkebir", "Yomra", "Beşikdüzü", "Şalpazarı", "Çarşıbaşı", "Dernekpazarı", "Düzköy", "Hayrat", "Köprübaşı" } },
            new CityData { Name = "Tunceli", Districts = new[] { "Çemişgezek", "Hozat", "Mazgirt", "Nazımiye", "Ovacık", "Pertek", "Pülümür", "Merkez" } },
            new CityData { Name = "Şanlıurfa", Districts = new[] { "Akçakale", "Birecik", "Bozova", "Ceylanpınar", "Eyyübiye", "Halfeti", "Haliliye", "Hilvan", "Karaköprü", "Siverek", "Suruç", "Viranşehir", "Harran" } },
            new CityData { Name = "Uşak", Districts = new[] { "Banaz", "Eşme", "Karahallı", "Sivaslı", "Ulubey", "Merkez" } },
            new CityData { Name = "Van", Districts = new[] { "Başkale", "Çatak", "Erciş", "Gevaş", "Gürpınar", "İpekyolu", "Muradiye", "Özalp", "Tuşba", "Bahçesaray", "Çaldıran", "Edremit", "Saray" } },
            new CityData { Name = "Yozgat", Districts = new[] { "Akdağmadeni", "Boğazlıyan", "Çayıralan", "Çekerek", "Sarıkaya", "Sorgun", "Şefaatli", "Yerköy", "Merkez", "Aydıncık", "Çandır", "Kadışehri", "Saraykent", "Yenifakılı" } },
            new CityData { Name = "Zonguldak", Districts = new[] { "Çaycuma", "Devrek", "Ereğli", "Merkez", "Alaplı", "Gökçebey" } },
            new CityData { Name = "Aksaray", Districts = new[] { "Ağaçören", "Eskil", "Gülağaç", "Güzelyurt", "Merkez", "Ortaköy", "Sarıyahşi" } },
            new CityData { Name = "Bayburt", Districts = new[] { "Merkez", "Aydıntepe", "Demirözü" } },
            new CityData { Name = "Karaman", Districts = new[] { "Ermenek", "Merkez", "Ayrancı", "Kazımkarabekir", "Başyayla", "Sarıveliler" } },
            new CityData { Name = "Kırıkkale", Districts = new[] { "Delice", "Keskin", "Merkez", "Sulakyurt", "Bahşili", "Balışeyh", "Çelebi", "Karakeçili", "Yahşihan" } },
            new CityData { Name = "Batman", Districts = new[] { "Merkez", "Beşiri", "Gercüş", "Kozluk", "Sason", "Hasankeyf" } },
            new CityData { Name = "Şırnak", Districts = new[] { "Beytüşşebap", "Cizre", "İdil", "Silopi", "Merkez", "Uludere", "Güçlükonak" } },
            new CityData { Name = "Bartın", Districts = new[] { "Merkez", "Kurucaşile", "Ulus", "Amasra" } },
            new CityData { Name = "Ardahan", Districts = new[] { "Merkez", "Çıldır", "Göle", "Hanak", "Posof", "Damal" } },
            new CityData { Name = "Iğdır", Districts = new[] { "Aralık", "Merkez", "Tuzluca", "Karakoyunlu" } },
            new CityData { Name = "Yalova", Districts = new[] { "Merkez", "Altınova", "Armutlu", "Çınarcık", "Çiftlikköy", "Termal" } },
            new CityData { Name = "Karabük", Districts = new[] { "Eflani", "Eskipazar", "Merkez", "Ovacık", "Safranbolu", "Yenice" } },
            new CityData { Name = "Kilis", Districts = new[] { "Merkez", "Elbeyli", "Musabeyli", "Polateli" } },
            new CityData { Name = "Osmaniye", Districts = new[] { "Bahçe", "Kadirli", "Merkez", "Düziçi", "Hasanbeyli", "Sumbas", "Toprakkale" } },
            new CityData { Name = "Düzce", Districts = new[] { "Akçakoca", "Merkez", "Yığılca", "Cumayeri", "Gölyaka", "Çilimli", "Gümüşova", "Kaynaşlı" } }
        };

        [HttpGet("cities")]
        public IActionResult GetCities()
        {
            var cities = CitiesData
                .Select((city, index) => new { id = index + 1, name = city.Name })
                .ToArray();
            
            return Ok(cities);
        }

        [HttpGet("districts/{cityId}")]
        public IActionResult GetDistricts(int cityId)
        {
            if (cityId < 1 || cityId > CitiesData.Count)
            {
                return BadRequest("Geçersiz il ID");
            }

            var city = CitiesData[cityId - 1];
            var districts = city.Districts
                .Select((districtName, index) => new { id = index + 1, name = districtName })
                .ToArray();
            
            return Ok(districts);
        }
    }

    public class CityData
    {
        public string Name { get; set; } = string.Empty;
        public string[] Districts { get; set; } = Array.Empty<string>();
    }
}