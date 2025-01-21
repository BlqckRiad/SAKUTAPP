// Firebase yapılandırması
const firebaseConfig = {
    databaseURL: "https://sakutwebapp-default-rtdb.europe-west1.firebasedatabase.app"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Modal nesnesi
let tipModal;

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // Modal nesnesini oluştur
    tipModal = new bootstrap.Modal(document.getElementById('tipModal'));
    // Tip verilerini yükle
    loadTipData();
});

// Tip verilerini yükle
function loadTipData() {
    const tipList = document.getElementById('tip-list');
    database.ref('urun-tipleri').on('value', (snapshot) => {
        let html = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Tip Adı</th>
                        <th>Açıklama</th>
                        <th>İşlemler</th>
                    </tr>
                </thead>
                <tbody>
        `;

        snapshot.forEach((childSnapshot) => {
            const tip = childSnapshot.val();
            const tipId = childSnapshot.key;
            html += `
                <tr>
                    <td>${tip.adi}</td>
                    <td>${tip.aciklama || '-'}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="editTip('${tipId}')">
                            <i class="fas fa-edit"></i> Düzenle
                        </button>
                        <button class="btn btn-danger btn-sm ms-2" onclick="deleteTip('${tipId}')">
                            <i class="fas fa-trash"></i> Sil
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        
        // Eğer veri yoksa mesaj göster
        if (!snapshot.exists()) {
            html = '<div class="alert alert-info">Henüz ürün tipi kaydı bulunmamaktadır.</div>';
        }
        
        tipList.innerHTML = html;
    });
}

// Yeni tip ekleme modalını göster
function showAddTipModal() {
    document.getElementById('tipModalLabel').textContent = 'Yeni Ürün Tipi Ekle';
    document.getElementById('tip-form').reset();
    document.getElementById('tip-id').value = '';
    tipModal.show();
}

// Tip düzenleme modalını göster
function editTip(tipId) {
    document.getElementById('tipModalLabel').textContent = 'Ürün Tipi Düzenle';
    document.getElementById('tip-id').value = tipId;
    
    // Tip verilerini getir ve forma doldur
    database.ref('urun-tipleri/' + tipId).once('value').then((snapshot) => {
        const tip = snapshot.val();
        document.getElementById('tip-adi').value = tip.adi;
        document.getElementById('tip-aciklama').value = tip.aciklama || '';
        tipModal.show();
    });
}

// Tip kaydet/güncelle
function saveTip() {
    const tipId = document.getElementById('tip-id').value;
    const tipData = {
        adi: document.getElementById('tip-adi').value,
        aciklama: document.getElementById('tip-aciklama').value
    };

    let saveOperation;
    if (tipId) {
        // Güncelleme
        saveOperation = database.ref('urun-tipleri/' + tipId).update(tipData);
    } else {
        // Yeni kayıt
        saveOperation = database.ref('urun-tipleri').push(tipData);
    }

    saveOperation.then(() => {
        tipModal.hide();
        showAlert(tipId ? 'Ürün tipi güncellendi!' : 'Yeni ürün tipi eklendi!', 'success');
    }).catch(error => {
        showAlert('Bir hata oluştu: ' + error.message, 'danger');
    });
}

// Tip sil
function deleteTip(tipId) {
    if (confirm('Bu ürün tipini silmek istediğinizden emin misiniz?')) {
        database.ref('urun-tipleri/' + tipId).remove()
            .then(() => {
                showAlert('Ürün tipi başarıyla silindi!', 'success');
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

// PDF'e aktar
function exportToPDF() {
    // PDF oluştur
    const element = document.createElement('div');
    element.innerHTML = `
        <div class="p-4">
            <h3 class="text-center mb-4">SAKUT - Ürün Tipleri Listesi</h3>
            <p class="text-end mb-4">Tarih: ${formatDate(new Date().toISOString())}</p>
            ${document.getElementById('tip-list').innerHTML}
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
        filename: 'urun-tipleri.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };
    
    // PDF oluştur ve indir
    html2pdf().set(opt).from(element).save();
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