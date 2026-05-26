/**
 * UNIFIED GOOGLE APPS SCRIPT FOR POS KASIR GOOGLE SHEETS
 * -------------------------------------------------------------
 * Panduan Instalasi:
 * 1. Buka Google Sheets baru.
 * 2. Klik menu "Ekstensi" -> "Apps Script".
 * 3. Hapus semua kode bawaan, lalu paste-kan semua kode di bawah ini.
 * 4. Ganti nama project menjadi "POS Kasir Backend".
 * 5. Jalankan fungsi "initializePOSDatabase" sekali saja untuk membuat tabel.
 * 6. Klik tombol "Terapkan" (Deploy) -> "Penerapan Baru" (New Deployment).
 * 7. Pilih tipe: "Aplikasi Web" (Web App).
 * 8. Konfigurasi:
 *    - Jalankan sebagai: "Saya" (Me / Akun Google Anda).
 *    - Siapa yang memiliki akses: "Siapa saja" (Anyone).
 * 9. Klik "Terapkan" dan berikan izin yang diperlukan.
 * 10. Salin URL Aplikasi Web yang diberikan, lalu masukkan ke dalam file .env 
 *     atau langsung ke tab "Pengaturan" di aplikasi POS ini.
 */

// Nama-nama Sheet Database
var SHEET_PRODUCTS = "Products";
var SHEET_TRANSACTIONS = "Transactions";

/**
 * Inisialisasi Database POS dengan tabel dan data sampel jika kosong.
 */
function initializePOSDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Inisialisasi Sheet Produk
  var sheetProducts = ss.getSheetByName(SHEET_PRODUCTS);
  if (!sheetProducts) {
    sheetProducts = ss.insertSheet(SHEET_PRODUCTS);
    var headers = ["id", "sku", "name", "price", "category", "stock", "barcode"];
    sheetProducts.appendRow(headers);
    
    // Tambahkan data sampel produk
    var sampleProducts = [
      ["P001", "KOP-SUT-01", "Kopi Susu Gula Aren", 18000, "Minuman", 50, "899123456781"],
      ["P002", "ROT-CHOC-02", "Roti Bakar Cokelat", 15000, "Makanan", 30, "899123456782"],
      ["P003", "MIL-GRE-03", "Matcha Latte", 20000, "Minuman", 40, "899123456783"],
      ["P004", "SNA-POT-04", "Kentang Goreng Keju", 12000, "Snack", 25, "899123456784"],
      ["P005", "TEA-LEM-05", "Lemon Tea Es", 10000, "Minuman", 60, "899123456785"],
      ["P006", "SNA-NACH-06", "Nachos Sauce Salsa", 16000, "Snack", 20, "899123456786"]
    ];
    for (var i = 0; i < sampleProducts.length; i++) {
      sheetProducts.appendRow(sampleProducts[i]);
    }
  }
  
  // 2. Inisialisasi Sheet Transaksi
  var sheetTransactions = ss.getSheetByName(SHEET_TRANSACTIONS);
  if (!sheetTransactions) {
    sheetTransactions = ss.insertSheet(SHEET_TRANSACTIONS);
    var headersTx = ["id", "timestamp", "items", "totalPrice", "cashPaid", "changeGiven", "paymentMethod", "cashierName"];
    sheetTransactions.appendRow(headersTx);
    
    // Tambahkan data sampel transaksi
    var sampleTx = [
      ["TRX1001", "2026-05-26T10:00:00.000Z", '[{"id":"P001","name":"Kopi Susu Gula Aren","price":18000,"quantity":2}]', 36000, 50000, 14000, "Cash", "Indy"],
      ["TRX1002", "2026-05-26T11:15:00.000Z", '[{"id":"P002","name":"Roti Bakar Cokelat","price":15000,"quantity":1},{"id":"P005","name":"Lemon Tea Es","price":10000,"quantity":1}]', 25000, 25000, 0, "QRIS", "System"]
    ];
    for (var j = 0; j < sampleTx.length; j++) {
      sheetTransactions.appendRow(sampleTx[j]);
    }
  }

  return "Database POS berhasil diinisialisasi!";
}

/**
 * Mengatur response header CORS yang aman dan konsisten untuk Apps Script.
 */
function outputJson(data) {
  var output = JSON.stringify(data);
  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle HTTP GET Requests
 * Mengambil data produk, transaksi, atau mengecek status API.
 */
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    return outputJson({ success: false, error: "Active spreadsheet tidak ditemukan. Hubungkan script dengan Google Sheet Anda." });
  }

  var action = e.parameter.action;

  // Inisialisasi default jika sheet belum ada
  if (!ss.getSheetByName(SHEET_PRODUCTS) || !ss.getSheetByName(SHEET_TRANSACTIONS)) {
    initializePOSDatabase();
  }

  try {
    if (action === "getProducts") {
      var products = readTableData(SHEET_PRODUCTS);
      return outputJson({ success: true, products: products });
    }
    
    if (action === "getTransactions") {
      var transactions = readTableData(SHEET_TRANSACTIONS);
      return outputJson({ success: true, transactions: transactions });
    }

    // Default action: Ambil semua data sekaligus (lebih cepat, menghemat request)
    if (action === "getData" || !action) {
      var products = readTableData(SHEET_PRODUCTS);
      var transactions = readTableData(SHEET_TRANSACTIONS);
      return outputJson({
        success: true,
        products: products,
        transactions: transactions
      });
    }

    return outputJson({ success: false, error: "Aksi tidak dikenal: " + action });
  } catch (err) {
    return outputJson({ success: false, error: err.toString() });
  }
}

/**
 * Handle HTTP POST Requests
 * Menambahkan transaksi baru, mengupdate stok, menambah/edit/hapus produk.
 */
function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    return outputJson({ success: false, error: "Active spreadsheet tidak ditemukan." });
  }

  try {
    var requestBody;
    if (e.postData && e.postData.contents) {
      requestBody = JSON.parse(e.postData.contents);
    } else {
      // Backup jika dikirim via parameter form
      requestBody = e.parameter;
    }

    var action = requestBody.action;
    if (!action) {
      return outputJson({ success: false, error: "Aksi (action) wajib disertakan dalam request body." });
    }

    // 1. TAMBAH TRANSAKSI BARU (KASIR CHECKOUT)
    if (action === "addTransaction") {
      var tx = requestBody.transaction;
      if (!tx) {
        return outputJson({ success: false, error: "Data transaksi tidak ditemukan." });
      }

      var sheetTx = ss.getSheetByName(SHEET_TRANSACTIONS);
      var newRow = [
        tx.id,
        tx.timestamp || new Date().toISOString(),
        typeof tx.items === 'string' ? tx.items : JSON.stringify(tx.items),
        Number(tx.totalPrice),
        Number(tx.cashPaid || 0),
        Number(tx.changeGiven || 0),
        tx.paymentMethod || "Cash",
        tx.cashierName || "Sistem"
      ];
      sheetTx.appendRow(newRow);

      // Kurangi stok produk secara otomatis di Google Sheets
      var itemsArray = [];
      try {
        itemsArray = typeof tx.items === 'string' ? JSON.parse(tx.items) : tx.items;
      } catch (pErr) {
        itemsArray = [];
      }

      if (Array.isArray(itemsArray) && itemsArray.length > 0) {
        var sheetProd = ss.getSheetByName(SHEET_PRODUCTS);
        var prodData = sheetProd.getDataRange().getValues();
        
        for (var i = 0; i < itemsArray.length; i++) {
          var item = itemsArray[i];
          var productId = item.id;
          var qtyToSubtract = Number(item.quantity || 1);

          // Cari di baris mana ID produk berada
          for (var r = 1; r < prodData.length; r++) {
            if (prodData[r][0].toString() === productId.toString()) {
              var currentStock = Number(prodData[r][5]);
              var newStock = Math.max(0, currentStock - qtyToSubtract);
              sheetProd.getCell(r + 1, 6).setValue(newStock); // Kolom stock adalah kolom ke-6 (F)
              break;
            }
          }
        }
      }

      return outputJson({ success: true, message: "Transaksi berhasil dicatat dan stok berhasil dikurangi!" });
    }

    // 2. TAMBAH ATAU EDIT PRODUK
    if (action === "saveProduct") {
      var prod = requestBody.product;
      if (!prod) {
        return outputJson({ success: false, error: "Data produk tidak ditemukan." });
      }

      var sheetProd = ss.getSheetByName(SHEET_PRODUCTS);
      var prodData = sheetProd.getDataRange().getValues();
      var foundIndex = -1;

      for (var r = 1; r < prodData.length; r++) {
        if (prodData[r][0].toString() === prod.id.toString()) {
          foundIndex = r + 1; // Baris spreadsheet (1-indexed + header)
          break;
        }
      }

      var rowValues = [
        prod.id,
        prod.sku || "",
        prod.name || "",
        Number(prod.price || 0),
        prod.category || "General",
        Number(prod.stock || 0),
        prod.barcode || ""
      ];

      if (foundIndex !== -1) {
        // Edit produk yang ada
        var range = sheetProd.getRange(foundIndex, 1, 1, rowValues.length);
        range.setValues([rowValues]);
        return outputJson({ success: true, message: "Produk berhasil diperbarui!", actionTaken: "update" });
      } else {
        // Buat produk baru
        sheetProd.appendRow(rowValues);
        return outputJson({ success: true, message: "Produk baru berhasil ditambahkan!", actionTaken: "create" });
      }
    }

    // 3. HAPUS PRODUK
    if (action === "deleteProduct") {
      var productId = requestBody.id;
      if (!productId) {
        return outputJson({ success: false, error: "ID produk tidak boleh kosong." });
      }

      var sheetProd = ss.getSheetByName(SHEET_PRODUCTS);
      var prodData = sheetProd.getDataRange().getValues();
      var foundIndex = -1;

      for (var r = 1; r < prodData.length; r++) {
        if (prodData[r][0].toString() === productId.toString()) {
          foundIndex = r + 1;
          break;
        }
      }

      if (foundIndex !== -1) {
        sheetProd.deleteRow(foundIndex);
        return outputJson({ success: true, message: "Produk berhasil dihapus!" });
      } else {
        return outputJson({ success: false, error: "Produk dengan ID " + productId + " tidak ditemukan." });
      }
    }

    // 4. RESET / INISIALISASI DATABASE
    if (action === "initialize") {
      var msg = initializePOSDatabase();
      return outputJson({ success: true, message: msg });
    }

    return outputJson({ success: false, error: "Aksi tidak dikenal dalam POST: " + action });

  } catch (err) {
    return outputJson({ success: false, error: err.toString() });
  }
}

/**
 * Membaca seluruh data dari spreadsheet dan merubahnya menjadi Array of Object
 * menggunakan header baris pertama sebagai field keys.
 */
function readTableData(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  if (values.length <= 1) return []; // Hanya berisi header atau kosong

  var headers = values[0];
  var result = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var obj = {};
    var hasValue = false;
    
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      // Bersihkan nilai atau jadikan tipe data yang tepat
      if (headers[j] === "price" || headers[j] === "stock" || headers[j] === "totalPrice" || headers[j] === "cashPaid" || headers[j] === "changeGiven") {
        val = Number(val || 0);
      }
      obj[headers[j]] = val;
      if (val !== "" && val !== null && val !== undefined) {
        hasValue = true;
      }
    }

    if (hasValue) {
      result.push(obj);
    }
  }

  return result;
}
