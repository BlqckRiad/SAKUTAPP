// Firebase yapılandırması
const firebaseConfig = {
    databaseURL: "https://sakutwebapp-default-rtdb.europe-west1.firebasedatabase.app"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    loadUyarilar();
});

// Uyarıları yükle
function loadUyarilar() {
    const uyariList = document.getElementById('uyari-list');
    const uyariSayisi = document.getElementById('uyari-sayisi');
    
    database.ref('urunler').on('value', (snapshot) => {
        const uyarilar = [];
        
        snapshot.forEach((childSnapshot) => {
            const urun = childSnapshot.val();
            urun.id = childSnapshot.key;
            
            if (urun.miktar <= urun.uyariSiniri) {
                uyarilar.push(urun);
            }
        });
        
        // Uyarı sayısını güncelle
        uyariSayisi.textContent = uyarilar.length + ' Uyarı';
        
        if (uyarilar.length === 0) {
            uyariList.innerHTML = '<div class="alert alert-success">Stok uyarısı bulunmuyor.</div>';
            return;
        }
        
        // Uyarıları listele
        let html = `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Ürün Adı</th>
                            <th>Mevcut Stok</th>
                            <th>Uyarı Sınırı</th>
                            <th>Durum</th>
                            <th>Depo</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        uyarilar.forEach(urun => {
            let stokDurumu, durumText;
            const eksikMiktar = urun.uyariSiniri - urun.miktar;
            
            if (urun.miktar === 0) {
                stokDurumu = 'bg-danger text-white';
                durumText = 'Stok Tükendi!';
            } else if (urun.miktar < urun.uyariSiniri) {
                stokDurumu = 'text-danger';
                durumText = `${eksikMiktar} ${urun.birim} Eksik`;
            }
            
            html += `
                <tr class="${stokDurumu}">
                    <td>${urun.adi}</td>
                    <td>${urun.miktar} ${urun.birim}</td>
                    <td>${urun.uyariSiniri} ${urun.birim}</td>
                    <td>${durumText}</td>
                    <td>${getDepoAdi(urun.depoId)}</td>
                    <td>
                        <a href="urun.html" class="btn btn-primary btn-sm" 
                           onclick="localStorage.setItem('selectedUrunId', '${urun.id}')">
                            <i class="fas fa-eye"></i> Ürüne Git
                        </a>
                        <button class="btn btn-success btn-sm ms-2" onclick="showStokEkleModal('${urun.id}')">
                            <i class="fas fa-plus"></i> Stok Ekle
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        uyariList.innerHTML = html;
    });
}

// Depo adını getir
function getDepoAdi(depoId) {
    return new Promise((resolve) => {
        database.ref('depolar/' + depoId).once('value').then((snapshot) => {
            const depo = snapshot.val();
            resolve(depo ? depo.adi : '-');
        });
    });
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

// Stok Ekleme Modalı
function showStokEkleModal(urunId) {
    // Ürün bilgilerini getir
    database.ref('urunler/' + urunId).once('value').then((snapshot) => {
        const urun = snapshot.val();
        const eksikMiktar = urun.uyariSiniri - urun.miktar;
        
        // Modal HTML
        const modalHtml = `
            <div class="modal fade" id="stokEkleModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Stok Ekle - ${urun.adi}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>
                                <strong>Mevcut Stok:</strong> ${urun.miktar} ${urun.birim}<br>
                                <strong>Uyarı Sınırı:</strong> ${urun.uyariSiniri} ${urun.birim}<br>
                                <strong>Eksik Miktar:</strong> ${eksikMiktar} ${urun.birim}
                            </p>
                            <form id="stok-ekle-form">
                                <div class="mb-3">
                                    <label class="form-label">Eklenecek Miktar (${urun.birim})</label>
                                    <input type="number" class="form-control" id="eklenecek-miktar" 
                                           min="1" value="${eksikMiktar}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Açıklama</label>
                                    <input type="text" class="form-control" id="stok-aciklama">
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
                            <button type="button" class="btn btn-primary" 
                                    onclick="stokEkle('${urunId}')">Stok Ekle</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Varsa eski modalı kaldır
        const oldModal = document.getElementById('stokEkleModal');
        if (oldModal) oldModal.remove();
        
        // Yeni modalı ekle ve göster
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('stokEkleModal'));
        modal.show();
    });
}

// Stok ekle
function stokEkle(urunId) {
    const miktar = parseInt(document.getElementById('eklenecek-miktar').value);
    const aciklama = document.getElementById('stok-aciklama').value;
    
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
            aciklama: aciklama || 'Uyarı sayfasından eklendi'
        };
        
        // Güncelleme işlemi
        const updates = {};
        updates['/urunler/' + urunId + '/miktar'] = yeniMiktar;
        updates['/urunler/' + urunId + '/stokGecmisi/' + database.ref().push().key] = stokGecmisi;
        
        database.ref().update(updates)
            .then(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('stokEkleModal'));
                modal.hide();
                showAlert('Stok başarıyla eklendi!', 'success');
            })
            .catch(error => {
                showAlert('Bir hata oluştu: ' + error.message, 'danger');
            });
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
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
} 