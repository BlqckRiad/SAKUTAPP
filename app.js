// Firebase yapılandırması
const firebaseConfig = {
    databaseURL: "https://sakutwebapp-default-rtdb.europe-west1.firebasedatabase.app"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Sayfa yükleme ve section gösterme
document.addEventListener('DOMContentLoaded', () => {
    showSection('depo');
    loadDepoData();
    loadPersonelData();
    loadUrunData();
});

function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(`${sectionName}-section`).style.display = 'block';
}

// Depo İşlemleri
document.getElementById('depo-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const depoAdi = document.getElementById('depo-adi').value;
    const depoKonum = document.getElementById('depo-konum').value;

    const newDepoRef = database.ref('depolar').push();
    newDepoRef.set({
        adi: depoAdi,
        konum: depoKonum
    }).then(() => {
        document.getElementById('depo-form').reset();
        loadDepoData();
    });
});

function loadDepoData() {
    const depoList = document.getElementById('depo-list');
    database.ref('depolar').on('value', (snapshot) => {
        let html = '<table class="table"><thead><tr><th>Depo Adı</th><th>Konum</th><th>İşlemler</th></tr></thead><tbody>';
        snapshot.forEach((childSnapshot) => {
            const depo = childSnapshot.val();
            const depoId = childSnapshot.key;
            html += `
                <tr>
                    <td>${depo.adi}</td>
                    <td>${depo.konum}</td>
                    <td>
                        <button class="btn btn-sm btn-warning btn-edit" onclick="editDepo('${depoId}')">Düzenle</button>
                        <button class="btn btn-sm btn-danger btn-delete" onclick="deleteDepo('${depoId}')">Sil</button>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        depoList.innerHTML = html;
    });
}

function deleteDepo(depoId) {
    if (confirm('Bu depoyu silmek istediğinizden emin misiniz?')) {
        database.ref('depolar/' + depoId).remove();
    }
}

// Personel İşlemleri
document.getElementById('personel-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const personelAd = document.getElementById('personel-ad').value;
    const personelDogum = document.getElementById('personel-dogum').value;
    const personelUnvan = document.getElementById('personel-unvan').value;

    const newPersonelRef = database.ref('personel').push();
    newPersonelRef.set({
        adSoyad: personelAd,
        dogumTarihi: personelDogum,
        unvan: personelUnvan
    }).then(() => {
        document.getElementById('personel-form').reset();
        loadPersonelData();
    });
});

function loadPersonelData() {
    const personelList = document.getElementById('personel-list');
    database.ref('personel').on('value', (snapshot) => {
        let html = '<table class="table"><thead><tr><th>Ad Soyad</th><th>Doğum Tarihi</th><th>Ünvan</th><th>İşlemler</th></tr></thead><tbody>';
        snapshot.forEach((childSnapshot) => {
            const personel = childSnapshot.val();
            const personelId = childSnapshot.key;
            html += `
                <tr>
                    <td>${personel.adSoyad}</td>
                    <td>${personel.dogumTarihi}</td>
                    <td>${personel.unvan}</td>
                    <td>
                        <button class="btn btn-sm btn-warning btn-edit" onclick="editPersonel('${personelId}')">Düzenle</button>
                        <button class="btn btn-sm btn-danger btn-delete" onclick="deletePersonel('${personelId}')">Sil</button>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        personelList.innerHTML = html;
    });
}

function deletePersonel(personelId) {
    if (confirm('Bu personeli silmek istediğinizden emin misiniz?')) {
        database.ref('personel/' + personelId).remove();
    }
}

// Ürün İşlemleri
document.getElementById('urun-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const urunAdi = document.getElementById('urun-adi').value;
    const urunTipi = document.getElementById('urun-tipi').value;
    const urunMiktar = document.getElementById('urun-miktar').value;

    const newUrunRef = database.ref('urunler').push();
    newUrunRef.set({
        adi: urunAdi,
        tipi: urunTipi,
        miktar: urunMiktar
    }).then(() => {
        document.getElementById('urun-form').reset();
        loadUrunData();
    });
});

function loadUrunData() {
    const urunList = document.getElementById('urun-list');
    database.ref('urunler').on('value', (snapshot) => {
        let html = '<table class="table"><thead><tr><th>Ürün Adı</th><th>Ürün Tipi</th><th>Miktar</th><th>İşlemler</th></tr></thead><tbody>';
        snapshot.forEach((childSnapshot) => {
            const urun = childSnapshot.val();
            const urunId = childSnapshot.key;
            html += `
                <tr>
                    <td>${urun.adi}</td>
                    <td>${urun.tipi}</td>
                    <td>${urun.miktar}</td>
                    <td>
                        <button class="btn btn-sm btn-warning btn-edit" onclick="editUrun('${urunId}')">Düzenle</button>
                        <button class="btn btn-sm btn-danger btn-delete" onclick="deleteUrun('${urunId}')">Sil</button>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        urunList.innerHTML = html;
    });
}

function deleteUrun(urunId) {
    if (confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
        database.ref('urunler/' + urunId).remove();
    }
} 