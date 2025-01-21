// Firebase yapılandırması
const firebaseConfig = {
    databaseURL: "https://sakutwebapp-default-rtdb.europe-west1.firebasedatabase.app"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Modal nesneleri
let urunModal;
let teslimModal;
let detayModal;

// Filtre değerleri
let currentFilters = {
    depo: '',
    tip: '',
    search: ''
};

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // Modal nesnelerini oluştur
    urunModal = new bootstrap.Modal(document.getElementById('urunModal'));
    teslimModal = new bootstrap.Modal(document.getElementById('teslimModal'));
    detayModal = new bootstrap.Modal(document.getElementById('urunDetayModal'));
    // Depoları yükle
    loadDepolar();
    // Ürün tiplerini yükle
    loadUrunTipleri();
    // Personel listesini yükle
    loadPersonelList();
    // Ürün verilerini yükle
    loadUrunData();
    // Uyarıları kontrol et
    checkStokUyarilari();
});

// Depoları yükle
function loadDepolar() {
    const depoSelect = document.getElementById('urun-depo');
    const depoFilter = document.getElementById('depo-filter');
    
    database.ref('depolar').on('value', (snapshot) => {
        let depoOptions = '<option value="">Depo Seçin</option>';
        let filterOptions = '<option value="">Tüm Depolar</option>';
        
        snapshot.forEach((childSnapshot) => {
            const depo = childSnapshot.val();
            const depoId = childSnapshot.key;
            const option = `<option value="${depoId}">${depo.adi}</option>`;
            depoOptions += option;
            filterOptions += option;
        });
        
        depoSelect.innerHTML = depoOptions;
        depoFilter.innerHTML = filterOptions;
    });
}

// Ürün tiplerini yükle
function loadUrunTipleri() {
    const tipSelect = document.getElementById('urun-tipi');
    const tipFilter = document.getElementById('tip-filter');
    
    database.ref('urun-tipleri').on('value', (snapshot) => {
        let tipOptions = '<option value="">Tip Seçin</option>';
        let filterOptions = '<option value="">Tüm Ürün Tipleri</option>';
        
        snapshot.forEach((childSnapshot) => {
            const tip = childSnapshot.val();
            const tipId = childSnapshot.key;
            const option = `<option value="${tipId}">${tip.adi}</option>`;
            tipOptions += option;
            filterOptions += option;
        });
        
        tipSelect.innerHTML = tipOptions;
        tipFilter.innerHTML = filterOptions;
    });
}

// Personel listesini yükle
function loadPersonelList() {
    const personelSelect = document.getElementById('teslim-personel');
    
    database.ref('personel').on('value', (snapshot) => {
        let options = '<option value="">Personel Seçin</option>';
        
        snapshot.forEach((childSnapshot) => {
            const personel = childSnapshot.val();
            const personelId = childSnapshot.key;
            options += `<option value="${personelId}">${personel.adSoyad}</option>`;
        });
        
        personelSelect.innerHTML = options;
    });
}

// Ürün verilerini yükle
function loadUrunData() {
    const urunList = document.getElementById('urun-list');
    database.ref('urunler').on('value', (snapshot) => {
        let html = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Ürün Adı</th>
                        <th>Tip</th>
                        <th>Miktar</th>
                        <th>Birim</th>
                        <th>Depo</th>
                        <th>Uyarı Sınırı</th>
                        <th>İşlemler</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let urunler = [];
        snapshot.forEach((childSnapshot) => {
            const urun = childSnapshot.val();
            urun.id = childSnapshot.key;
            urunler.push(urun);
        });

        // Filtreleme
        urunler = urunler.filter(urun => {
            const matchDepo = !currentFilters.depo || urun.depoId === currentFilters.depo;
            const matchTip = !currentFilters.tip || urun.tipId === currentFilters.tip;
            const matchSearch = !currentFilters.search || 
                urun.adi.toLowerCase().includes(currentFilters.search.toLowerCase());
            
            return matchDepo && matchTip && matchSearch;
        });

        // Filtrelenmiş ürünleri göster
        urunler.forEach(urun => {
            const stokDurumu = urun.miktar <= urun.uyariSiniri ? 'text-danger fw-bold' : '';
            html += `
                <tr>
                    <td>${urun.adi}</td>
                    <td>${getUrunTipAdi(urun.tipId)}</td>
                    <td class="${stokDurumu}">${urun.miktar} ${urun.birim}</td>
                    <td>${urun.birim}</td>
                    <td>${getDepoAdi(urun.depoId)}</td>
                    <td>${urun.uyariSiniri} ${urun.birim}</td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="showUrunDetay('${urun.id}')">
                            <i class="fas fa-info-circle"></i> Detay
                        </button>
                        <button class="btn btn-warning btn-sm ms-2" onclick="editUrun('${urun.id}')">
                            <i class="fas fa-edit"></i> Düzenle
                        </button>
                        <button class="btn btn-danger btn-sm ms-2" onclick="deleteUrun('${urun.id}')">
                            <i class="fas fa-trash"></i> Sil
                        </button>
                        <button class="btn btn-success btn-sm ms-2" onclick="showTeslimModal('${urun.id}')">
                            <i class="fas fa-hand-holding"></i> Teslim Et
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        
        // Eğer veri yoksa mesaj göster
        if (urunler.length === 0) {
            html = '<div class="alert alert-info">Ürün bulunamadı.</div>';
        }
        
        urunList.innerHTML = html;
    });
}

// Depo adını getir
function getDepoAdi(depoId) {
    const depoSelect = document.getElementById('urun-depo');
    const depoOption = depoSelect.querySelector(`option[value="${depoId}"]`);
    return depoOption ? depoOption.textContent : '-';
}

// Ürün tipi adını getir
function getUrunTipAdi(tipId) {
    const tipSelect = document.getElementById('urun-tipi');
    const tipOption = tipSelect.querySelector(`option[value="${tipId}"]`);
    return tipOption ? tipOption.textContent : '-';
}

// Filtreleme işlemi
function filterUrunler() {
    currentFilters = {
        depo: document.getElementById('depo-filter').value,
        tip: document.getElementById('tip-filter').value,
        search: document.getElementById('search-filter').value
    };
    loadUrunData();
}

// Yeni ürün ekleme modalını göster
function showAddUrunModal() {
    document.getElementById('urunModalLabel').textContent = 'Yeni Ürün Ekle';
    document.getElementById('urun-form').reset();
    document.getElementById('urun-id').value = '';
    urunModal.show();
}

// Ürün düzenleme modalını göster
function editUrun(urunId) {
    document.getElementById('urunModalLabel').textContent = 'Ürün Düzenle';
    document.getElementById('urun-id').value = urunId;
    
    // Ürün verilerini getir ve forma doldur
    database.ref('urunler/' + urunId).once('value').then((snapshot) => {
        const urun = snapshot.val();
        document.getElementById('urun-adi').value = urun.adi;
        document.getElementById('urun-tipi').value = urun.tipId;
        document.getElementById('urun-miktar').value = urun.miktar;
        document.getElementById('urun-uyari').value = urun.uyariSiniri;
        document.getElementById('urun-birim').value = urun.birim;
        document.getElementById('urun-depo').value = urun.depoId;
        document.getElementById('urun-aciklama').value = urun.aciklama || '';
        urunModal.show();
    });
}

// Ürün kaydet/güncelle
function saveUrun() {
    const urunId = document.getElementById('urun-id').value;
    const urunData = {
        adi: document.getElementById('urun-adi').value,
        tipId: document.getElementById('urun-tipi').value,
        miktar: parseInt(document.getElementById('urun-miktar').value),
        uyariSiniri: parseInt(document.getElementById('urun-uyari').value),
        birim: document.getElementById('urun-birim').value,
        depoId: document.getElementById('urun-depo').value,
        aciklama: document.getElementById('urun-aciklama').value
    };

    // Validasyonlar
    if (!urunData.tipId) {
        showAlert('Lütfen bir ürün tipi seçin!', 'warning');
        return;
    }

    if (!urunData.depoId) {
        showAlert('Lütfen bir depo seçin!', 'warning');
        return;
    }

    let saveOperation;
    if (urunId) {
        // Güncelleme
        saveOperation = database.ref('urunler/' + urunId).update(urunData);
    } else {
        // Yeni kayıt
        const newUrunRef = database.ref('urunler').push();
        
        // Stok geçmişi kaydı
        const stokGecmisi = {
            tarih: new Date().toISOString(),
            islem: 'ekleme',
            miktar: urunData.miktar,
            aciklama: 'İlk stok girişi'
        };
        
        urunData.stokGecmisi = {
            [database.ref().push().key]: stokGecmisi
        };
        
        saveOperation = newUrunRef.set(urunData);
    }

    saveOperation.then(() => {
        urunModal.hide();
        showAlert(urunId ? 'Ürün güncellendi!' : 'Yeni ürün eklendi!', 'success');
        checkStokUyarilari();
    }).catch(error => {
        showAlert('Bir hata oluştu: ' + error.message, 'danger');
    });
}

// Ürün sil
function deleteUrun(urunId) {
    if (confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
        database.ref('urunler/' + urunId).remove()
            .then(() => {
                showAlert('Ürün başarıyla silindi!', 'success');
            })
            .catch(error => {
                showAlert('Silme işlemi başarısız: ' + error.message, 'danger');
            });
    }
}

// Teslim modalını göster
function showTeslimModal(urunId) {
    document.getElementById('teslim-urun-id').value = urunId;
    
    // Ürün verilerini getir
    database.ref('urunler/' + urunId).once('value').then((snapshot) => {
        const urun = snapshot.val();
        
        // Ürün bilgilerini göster
        document.getElementById('teslim-urun-bilgi').textContent = 
            `${urun.adi} (${getUrunTipAdi(urun.tipId)})`;
        document.getElementById('teslim-birim').textContent = urun.birim;
        document.getElementById('teslim-stok').textContent = `${urun.miktar} ${urun.birim}`;
        
        // Miktar alanını ayarla
        const miktarInput = document.getElementById('teslim-miktar');
        miktarInput.max = urun.miktar;
        miktarInput.value = 1;
        
        teslimModal.show();
    });
}

// Ürün teslim et
function teslimEt() {
    const urunId = document.getElementById('teslim-urun-id').value;
    const miktar = parseInt(document.getElementById('teslim-miktar').value);
    const personelId = document.getElementById('teslim-personel').value;
    const aciklama = document.getElementById('teslim-aciklama').value;
    
    // Validasyonlar
    if (!personelId) {
        showAlert('Lütfen personel seçin!', 'warning');
        return;
    }
    
    if (!miktar || miktar < 1) {
        showAlert('Lütfen geçerli bir miktar girin!', 'warning');
        return;
    }
    
    // Ürün verisini getir
    database.ref('urunler/' + urunId).once('value').then((snapshot) => {
        const urun = snapshot.val();
        
        // Stok kontrolü
        if (miktar > urun.miktar) {
            showAlert('Stokta yeterli ürün yok!', 'warning');
            return;
        }
        
        // Teslim kaydı oluştur
        const teslimData = {
            urunId: urunId,
            urunAdi: urun.adi,
            tipId: urun.tipId,
            personelId: personelId,
            miktar: miktar,
            birim: urun.birim,
            aciklama: aciklama,
            tarih: new Date().toISOString(),
            durum: 'teslim' // teslim veya iade
        };
        
        // Teslim kaydını ekle ve stoku güncelle
        const updates = {};
        updates['/teslimler/' + database.ref().push().key] = teslimData;
        updates['/urunler/' + urunId + '/miktar'] = urun.miktar - miktar;
        
        database.ref().update(updates)
            .then(() => {
                teslimModal.hide();
                showAlert('Ürün başarıyla teslim edildi!', 'success');
            })
            .catch(error => {
                showAlert('Bir hata oluştu: ' + error.message, 'danger');
            });
    });
}

// Ürün detaylarını göster
function showUrunDetay(urunId) {
    // Ürün verilerini getir
    database.ref('urunler/' + urunId).once('value').then((snapshot) => {
        const urun = snapshot.val();
        
        // Ürün bilgilerini göster
        document.getElementById('detay-urun-adi').textContent = urun.adi;
        document.getElementById('detay-urun-tipi').textContent = getUrunTipAdi(urun.tipId);
        document.getElementById('detay-urun-stok').textContent = `${urun.miktar} ${urun.birim}`;
        document.getElementById('detay-urun-depo').textContent = getDepoAdi(urun.depoId);
        document.getElementById('detay-urun-uyari').textContent = `${urun.uyariSiniri} ${urun.birim}`;
        document.getElementById('detay-urun-aciklama').textContent = urun.aciklama || '-';
        
        // Stok geçmişini göster
        const stokGecmisiTable = document.getElementById('stok-gecmisi');
        let gecmisHtml = '';
        
        if (urun.stokGecmisi) {
            Object.entries(urun.stokGecmisi)
                .sort((a, b) => new Date(b[1].tarih) - new Date(a[1].tarih))
                .forEach(([key, gecmis]) => {
                    gecmisHtml += `
                        <tr>
                            <td>${formatDate(gecmis.tarih)}</td>
                            <td>${gecmis.islem}</td>
                            <td>${gecmis.miktar} ${urun.birim}</td>
                            <td>${gecmis.aciklama || '-'}</td>
                        </tr>
                    `;
                });
        }
        
        stokGecmisiTable.innerHTML = gecmisHtml || '<tr><td colspan="4" class="text-center">Geçmiş bulunamadı</td></tr>';
        
        // Stok ekleme formunu hazırla
        document.getElementById('ekle-miktar').value = '';
        document.getElementById('ekle-aciklama').value = '';
        
        // Ürün ID'sini sakla
        document.getElementById('urunDetayModal').dataset.urunId = urunId;
        
        detayModal.show();
    });
}

// Stok ekle
function stokEkle() {
    const urunId = document.getElementById('urunDetayModal').dataset.urunId;
    const miktar = parseInt(document.getElementById('ekle-miktar').value);
    const aciklama = document.getElementById('ekle-aciklama').value;
    
    if (!miktar || miktar < 1) {
        showAlert('Lütfen geçerli bir miktar girin!', 'warning');
        return;
    }
    
    // Ürün verisini getir
    database.ref('urunler/' + urunId).once('value').then((snapshot) => {
        const urun = snapshot.val();
        const yeniMiktar = (urun.miktar || 0) + miktar;
        
        // Stok geçmişi kaydı
        const stokGecmisi = {
            tarih: new Date().toISOString(),
            islem: 'ekleme',
            miktar: miktar,
            aciklama: aciklama
        };
        
        // Güncelleme işlemi
        const updates = {};
        updates['/urunler/' + urunId + '/miktar'] = yeniMiktar;
        updates['/urunler/' + urunId + '/stokGecmisi/' + database.ref().push().key] = stokGecmisi;
        
        database.ref().update(updates)
            .then(() => {
                showAlert('Stok başarıyla eklendi!', 'success');
                showUrunDetay(urunId); // Detay sayfasını yenile
                checkStokUyarilari();
            })
            .catch(error => {
                showAlert('Bir hata oluştu: ' + error.message, 'danger');
            });
    });
}

// Stok uyarılarını kontrol et
function checkStokUyarilari() {
    database.ref('urunler').once('value').then((snapshot) => {
        const uyarilar = [];
        
        snapshot.forEach((childSnapshot) => {
            const urun = childSnapshot.val();
            if (urun.miktar <= urun.uyariSiniri) {
                uyarilar.push({
                    id: childSnapshot.key,
                    adi: urun.adi,
                    miktar: urun.miktar,
                    uyariSiniri: urun.uyariSiniri,
                    birim: urun.birim
                });
            }
        });
        
        // Uyarıları kaydet
        if (uyarilar.length > 0) {
            database.ref('uyarilar').set({
                tarih: new Date().toISOString(),
                urunler: uyarilar
            });
        }
    });
}

// Bildirim göster
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    // 3 saniye sonra bildirimi kaldır
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// Tarih formatla
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// PDF'e aktar
function exportToPDF() {
    // Mevcut filtreleri kaydet
    const currentDepoFilter = document.getElementById('depo-filter').value;
    const currentTipFilter = document.getElementById('tip-filter').value;
    const currentSearchFilter = document.getElementById('search-filter').value;
    
    // Tüm filtreleri temizle
    document.getElementById('depo-filter').value = '';
    document.getElementById('tip-filter').value = '';
    document.getElementById('search-filter').value = '';
    
    // Listeyi güncelle ve PDF oluştur
    database.ref('urunler').once('value').then((snapshot) => {
        let html = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Ürün Adı</th>
                        <th>Tip</th>
                        <th>Miktar</th>
                        <th>Birim</th>
                        <th>Depo</th>
                        <th>Uyarı Sınırı</th>
                    </tr>
                </thead>
                <tbody>
        `;

        snapshot.forEach((childSnapshot) => {
            const urun = childSnapshot.val();
            const stokDurumu = urun.miktar <= urun.uyariSiniri ? 'text-danger fw-bold' : '';
            
            html += `
                <tr>
                    <td>${urun.adi}</td>
                    <td>${getUrunTipAdi(urun.tipId)}</td>
                    <td class="${stokDurumu}">${urun.miktar} ${urun.birim}</td>
                    <td>${urun.birim}</td>
                    <td>${getDepoAdi(urun.depoId)}</td>
                    <td>${urun.uyariSiniri} ${urun.birim}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        
        // PDF container oluştur
        const container = document.createElement('div');
        container.innerHTML = `
            <div class="p-4">
                <h3 class="text-center mb-4">SAKUT - Ürün Listesi</h3>
                <p class="text-end mb-4">Tarih: ${formatDate(new Date().toISOString())}</p>
                ${html}
            </div>
        `;
        
        // PDF seçenekleri
        const opt = {
            margin: 1,
            filename: 'urunler.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                logging: true
            },
            jsPDF: { unit: 'cm', format: 'a4', orientation: 'landscape' }
        };
        
        // PDF oluştur ve indir
        html2pdf().set(opt).from(container).save()
            .then(() => {
                // Filtreleri geri yükle
                document.getElementById('depo-filter').value = currentDepoFilter;
                document.getElementById('tip-filter').value = currentTipFilter;
                document.getElementById('search-filter').value = currentSearchFilter;
                filterUrunler(); // Listeyi güncelle
            })
            .catch(err => {
                console.error('PDF oluşturma hatası:', err);
                showAlert('PDF oluşturulurken bir hata oluştu', 'danger');
                // Filtreleri geri yükle
                document.getElementById('depo-filter').value = currentDepoFilter;
                document.getElementById('tip-filter').value = currentTipFilter;
                document.getElementById('search-filter').value = currentSearchFilter;
                filterUrunler();
            });
    });
} 