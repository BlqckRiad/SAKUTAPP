// Firebase yapılandırması
const firebaseConfig = {
    databaseURL: "https://sakutwebapp-default-rtdb.europe-west1.firebasedatabase.app"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Modal nesnesi
let depoModal;

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // Modal nesnesini oluştur
    depoModal = new bootstrap.Modal(document.getElementById('depoModal'));
    // Depo verilerini yükle
    loadDepoData();
});

// Depo verilerini yükle
function loadDepoData() {
    const depoList = document.getElementById('depo-list');
    database.ref('depolar').on('value', (snapshot) => {
        let html = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Depo Adı</th>
                        <th>Konum</th>
                        <th>İşlemler</th>
                    </tr>
                </thead>
                <tbody>
        `;

        snapshot.forEach((childSnapshot) => {
            const depo = childSnapshot.val();
            const depoId = childSnapshot.key;
            html += `
                <tr>
                    <td>${depo.adi}</td>
                    <td>${depo.konum}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="editDepo('${depoId}')">
                            <i class="fas fa-edit"></i> Düzenle
                        </button>
                        <button class="btn btn-danger btn-sm ms-2" onclick="deleteDepo('${depoId}')">
                            <i class="fas fa-trash"></i> Sil
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        
        // Eğer veri yoksa mesaj göster
        if (!snapshot.exists()) {
            html = '<div class="alert alert-info">Henüz depo kaydı bulunmamaktadır.</div>';
        }
        
        depoList.innerHTML = html;
    });
}

// Yeni depo ekleme modalını göster
function showAddDepoModal() {
    document.getElementById('depoModalLabel').textContent = 'Yeni Depo Ekle';
    document.getElementById('depo-form').reset();
    document.getElementById('depo-id').value = '';
    depoModal.show();
}

// Depo düzenleme modalını göster
function editDepo(depoId) {
    document.getElementById('depoModalLabel').textContent = 'Depo Düzenle';
    document.getElementById('depo-id').value = depoId;
    
    // Depo verilerini getir ve forma doldur
    database.ref('depolar/' + depoId).once('value').then((snapshot) => {
        const depo = snapshot.val();
        document.getElementById('depo-adi').value = depo.adi;
        document.getElementById('depo-konum').value = depo.konum;
        depoModal.show();
    });
}

// Depo kaydet/güncelle
function saveDepo() {
    const depoId = document.getElementById('depo-id').value;
    const depoAdi = document.getElementById('depo-adi').value;
    const depoKonum = document.getElementById('depo-konum').value;

    const depoData = {
        adi: depoAdi,
        konum: depoKonum
    };

    let saveOperation;
    if (depoId) {
        // Güncelleme
        saveOperation = database.ref('depolar/' + depoId).update(depoData);
    } else {
        // Yeni kayıt
        saveOperation = database.ref('depolar').push(depoData);
    }

    saveOperation.then(() => {
        depoModal.hide();
        showAlert(depoId ? 'Depo güncellendi!' : 'Yeni depo eklendi!', 'success');
    }).catch(error => {
        showAlert('Bir hata oluştu: ' + error.message, 'danger');
    });
}

// Depo sil
function deleteDepo(depoId) {
    if (confirm('Bu depoyu silmek istediğinizden emin misiniz?')) {
        database.ref('depolar/' + depoId).remove()
            .then(() => {
                showAlert('Depo başarıyla silindi!', 'success');
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
            <h3 class="text-center mb-4">SAKUT - Depo Listesi</h3>
            <p class="text-end mb-4">Tarih: ${formatDate(new Date().toISOString())}</p>
            ${document.getElementById('depo-list').innerHTML}
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
        filename: 'depolar.pdf',
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