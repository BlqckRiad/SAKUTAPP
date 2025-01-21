// Firebase yapılandırması
const firebaseConfig = {
    databaseURL: "https://sakutwebapp-default-rtdb.europe-west1.firebasedatabase.app"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Modal nesnesi
let personelModal;

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // Modal nesnesini oluştur
    personelModal = new bootstrap.Modal(document.getElementById('personelModal'));
    // Personel verilerini yükle
    loadPersonelData();
});

// Personel verilerini yükle
function loadPersonelData() {
    const personelList = document.getElementById('personel-list');
    database.ref('personel').on('value', (snapshot) => {
        let html = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Ad Soyad</th>
                        <th>Doğum Tarihi</th>
                        <th>Ünvan</th>
                        <th>Telefon</th>
                        <th>E-posta</th>
                        <th>İşlemler</th>
                    </tr>
                </thead>
                <tbody>
        `;

        snapshot.forEach((childSnapshot) => {
            const personel = childSnapshot.val();
            const personelId = childSnapshot.key;
            html += `
                <tr>
                    <td>${personel.adSoyad}</td>
                    <td>${formatDate(personel.dogumTarihi)}</td>
                    <td>${personel.unvan}</td>
                    <td>${personel.telefon || '-'}</td>
                    <td>${personel.email || '-'}</td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="showPersonelDetay('${personelId}')">
                            <i class="fas fa-info-circle"></i> Detay
                        </button>
                        <button class="btn btn-warning btn-sm ms-2" onclick="editPersonel('${personelId}')">
                            <i class="fas fa-edit"></i> Düzenle
                        </button>
                        <button class="btn btn-danger btn-sm ms-2" onclick="deletePersonel('${personelId}')">
                            <i class="fas fa-trash"></i> Sil
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        
        // Eğer veri yoksa mesaj göster
        if (!snapshot.exists()) {
            html = '<div class="alert alert-info">Henüz personel kaydı bulunmamaktadır.</div>';
        }
        
        personelList.innerHTML = html;
    });
}

// Tarihi formatla
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
}

// Yeni personel ekleme modalını göster
function showAddPersonelModal() {
    document.getElementById('personelModalLabel').textContent = 'Yeni Personel Ekle';
    document.getElementById('personel-form').reset();
    document.getElementById('personel-id').value = '';
    personelModal.show();
}

// Personel düzenleme modalını göster
function editPersonel(personelId) {
    document.getElementById('personelModalLabel').textContent = 'Personel Düzenle';
    document.getElementById('personel-id').value = personelId;
    
    // Personel verilerini getir ve forma doldur
    database.ref('personel/' + personelId).once('value').then((snapshot) => {
        const personel = snapshot.val();
        document.getElementById('personel-ad').value = personel.adSoyad;
        document.getElementById('personel-dogum').value = personel.dogumTarihi;
        document.getElementById('personel-unvan').value = personel.unvan;
        document.getElementById('personel-telefon').value = personel.telefon || '';
        document.getElementById('personel-email').value = personel.email || '';
        personelModal.show();
    });
}

// Personel kaydet/güncelle
function savePersonel() {
    const personelId = document.getElementById('personel-id').value;
    const personelData = {
        adSoyad: document.getElementById('personel-ad').value,
        dogumTarihi: document.getElementById('personel-dogum').value,
        unvan: document.getElementById('personel-unvan').value,
        telefon: document.getElementById('personel-telefon').value,
        email: document.getElementById('personel-email').value
    };

    let saveOperation;
    if (personelId) {
        // Güncelleme
        saveOperation = database.ref('personel/' + personelId).update(personelData);
    } else {
        // Yeni kayıt
        saveOperation = database.ref('personel').push(personelData);
    }

    saveOperation.then(() => {
        personelModal.hide();
        showAlert(personelId ? 'Personel güncellendi!' : 'Yeni personel eklendi!', 'success');
    }).catch(error => {
        showAlert('Bir hata oluştu: ' + error.message, 'danger');
    });
}

// Personel sil
function deletePersonel(personelId) {
    if (confirm('Bu personeli silmek istediğinizden emin misiniz?')) {
        database.ref('personel/' + personelId).remove()
            .then(() => {
                showAlert('Personel başarıyla silindi!', 'success');
            })
            .catch(error => {
                showAlert('Silme işlemi başarısız: ' + error.message, 'danger');
            });
    }
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

// Personel detay modalını göster
function showPersonelDetay(personelId) {
    // Personel bilgilerini getir
    database.ref('personel/' + personelId).once('value').then((snapshot) => {
        const personel = snapshot.val();
        
        // Teslim kayıtlarını getir
        database.ref('teslimler').orderByChild('personelId').equalTo(personelId).once('value').then((teslimSnapshot) => {
            let teslimHtml = '<div class="mt-4"><h6>Teslim Alınan Ürünler</h6>';
            
            if (teslimSnapshot.exists()) {
                teslimHtml += `
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Tarih</th>
                                <th>Ürün</th>
                                <th>Miktar</th>
                                <th>Durum</th>
                                <th>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                teslimSnapshot.forEach((teslimChild) => {
                    const teslim = teslimChild.val();
                    const teslimId = teslimChild.key;
                    
                    teslimHtml += `
                        <tr>
                            <td>${formatDate(teslim.tarih)}</td>
                            <td>${teslim.urunAdi}</td>
                            <td>${teslim.miktar} ${teslim.birim}</td>
                            <td>
                                <span class="badge bg-${teslim.durum === 'teslim' ? 'success' : 'info'}">
                                    ${teslim.durum === 'teslim' ? 'Teslim Alındı' : 'İade Edildi'}
                                </span>
                            </td>
                            <td>
                                ${teslim.durum === 'teslim' ? `
                                    <button class="btn btn-info btn-sm" onclick="iadeEt('${teslimId}')">
                                        <i class="fas fa-undo"></i> İade Et
                                    </button>
                                ` : '-'}
                            </td>
                        </tr>
                    `;
                });
                
                teslimHtml += '</tbody></table>';
            } else {
                teslimHtml += '<div class="alert alert-info">Henüz teslim alınan ürün bulunmamaktadır.</div>';
            }
            
            teslimHtml += '</div>';
            
            // Modal içeriğini oluştur
            const modalHtml = `
                <div class="modal fade" id="personelDetayModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Personel Detayları</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body" id="personelDetayContent">
                                <div class="row">
                                    <div class="col-md-6">
                                        <p><strong>Ad Soyad:</strong> ${personel.adSoyad}</p>
                                        <p><strong>Doğum Tarihi:</strong> ${formatDate(personel.dogumTarihi)}</p>
                                        <p><strong>Ünvan:</strong> ${personel.unvan}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <p><strong>Telefon:</strong> ${personel.telefon || '-'}</p>
                                        <p><strong>E-posta:</strong> ${personel.email || '-'}</p>
                                    </div>
                                </div>
                                ${teslimHtml}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-success" onclick="exportPersonelDetayToPDF('${personel.adSoyad}')">
                                    <i class="fas fa-file-pdf"></i> PDF İndir
                                </button>
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Varsa önceki modalı kaldır
            const oldModal = document.getElementById('personelDetayModal');
            if (oldModal) {
                oldModal.remove();
            }
            
            // Yeni modalı ekle ve göster
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const detayModal = new bootstrap.Modal(document.getElementById('personelDetayModal'));
            detayModal.show();
            
            // Modal kapandığında kaldır
            document.getElementById('personelDetayModal').addEventListener('hidden.bs.modal', function () {
                this.remove();
            });
        });
    });
}

// İade işlemi
function iadeEt(teslimId) {
    if (confirm('Bu ürünü iade almak istediğinizden emin misiniz?')) {
        // Teslim kaydını getir
        database.ref('teslimler/' + teslimId).once('value').then((snapshot) => {
            const teslim = snapshot.val();
            
            // Ürün stoğunu güncelle
            database.ref('urunler/' + teslim.urunId).once('value').then((urunSnapshot) => {
                const urun = urunSnapshot.val();
                const yeniMiktar = (urun.miktar || 0) + teslim.miktar;
                
                // Güncelleme işlemi
                const updates = {};
                updates['/teslimler/' + teslimId + '/durum'] = 'iade';
                updates['/urunler/' + teslim.urunId + '/miktar'] = yeniMiktar;
                
                database.ref().update(updates)
                    .then(() => {
                        showAlert('Ürün başarıyla iade alındı!', 'success');
                        // Detay modalını yeniden yükle
                        const personelId = teslim.personelId;
                        const detayModal = bootstrap.Modal.getInstance(document.getElementById('personelDetayModal'));
                        detayModal.hide();
                        showPersonelDetay(personelId);
                    })
                    .catch(error => {
                        showAlert('Bir hata oluştu: ' + error.message, 'danger');
                    });
            });
        });
    }
}

// Personel detayını PDF'e aktar
function exportPersonelDetayToPDF(personelAdi) {
    const element = document.getElementById('personelDetayContent').cloneNode(true);
    
    // İade butonlarını kaldır
    const buttons = element.getElementsByClassName('btn');
    while (buttons.length > 0) {
        buttons[0].parentNode.removeChild(buttons[0]);
    }
    
    // PDF içeriğini oluştur
    const pdfContainer = document.createElement('div');
    pdfContainer.innerHTML = `
        <div class="p-4">
            <h3 class="text-center mb-4">SAKUT - Personel Detay Raporu</h3>
            <p class="text-end mb-4">Tarih: ${formatDate(new Date().toISOString())}</p>
            ${element.innerHTML}
        </div>
    `;
    
    // PDF seçenekleri
    const opt = {
        margin: 1,
        filename: `personel-${personelAdi.toLowerCase().replace(/\s+/g, '-')}-detay.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };
    
    // PDF oluştur ve indir
    html2pdf().set(opt).from(pdfContainer).save();
}

// PDF'e aktar
function exportToPDF() {
    // PDF oluştur
    const element = document.createElement('div');
    element.innerHTML = `
        <div class="p-4">
            <h3 class="text-center mb-4">SAKUT - Personel Listesi</h3>
            <p class="text-end mb-4">Tarih: ${formatDate(new Date().toISOString())}</p>
            ${document.getElementById('personel-list').innerHTML}
        </div>
    `;
    
    // İşlem butonlarını gizle
    const buttons = element.getElementsByClassName('btn');
    while (buttons.length > 0) {
        buttons[0].parentNode.removeChild(buttons[0]);
    }
    
    // PDF seçenekleri
    const opt = {
        margin: 1,
        filename: 'personel.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };
    
    // PDF oluştur ve indir
    html2pdf().set(opt).from(element).save();
} 