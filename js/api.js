/* =========================================================
   TRADING JOURNAL
   api.js
   VERSION: FINAL
   GOOGLE APPS SCRIPT + GOOGLE SHEETS

   SHEET TRANSAKSI:
   ID
   Tanggal
   Saham
   Aksi
   Harga
   Lot
   Profit/Rugi
   Nominal
   Catatan

   SHEET MODAL:
   ID
   Tanggal
   Jenis
   Nominal
   Catatan

   FITUR:
   - GET ALL DATA
   - ADD TRANSACTION
   - UPDATE TRANSACTION
   - DELETE TRANSACTION
   - ADD CAPITAL
   - WITHDRAW CAPITAL
   - GET CAPITAL
   - GET REPORT
========================================================= */

"use strict";


/* =========================================================
   GOOGLE APPS SCRIPT URL
========================================================= */

const API_URL =
  "https://script.google.com/macros/s/AKfycbypUxWIp8OemScOwiqDeLnnSjpfGb3bVZHw_pzPMIWFSUWiURc6rseuRi5bOZ9LFMGK_A/exec";


/* =========================================================
   CONFIG
========================================================= */

const API_CONFIG = {

  timeout:
    30000,

  /*
   * Body tetap JSON.
   *
   * Content-Type text/plain digunakan
   * agar lebih aman terhadap CORS Apps Script.
   */

  contentType:
    "text/plain;charset=UTF-8"

};


/* =========================================================
   SHEET FIELD
========================================================= */

const TRANSACTION_FIELDS = {

  id:
    "ID",

  tanggal:
    "Tanggal",

  saham:
    "Saham",

  aksi:
    "Aksi",

  harga:
    "Harga",

  lot:
    "Lot",

  profitRugi:
    "Profit/Rugi",

  nominal:
    "Nominal",

  catatan:
    "Catatan"

};


const MODAL_FIELDS = {

  id:
    "ID",

  tanggal:
    "Tanggal",

  jenis:
    "Jenis",

  nominal:
    "Nominal",

  catatan:
    "Catatan"

};


/* =========================================================
   VALIDATE API URL
========================================================= */

function validateApiUrl() {

  if (
    !API_URL ||
    typeof API_URL !== "string"
  ) {

    throw new Error(
      "API_URL belum diisi."
    );

  }


  if (
    API_URL.includes(
      "GANTI_DENGAN"
    )
  ) {

    throw new Error(
      "API_URL masih menggunakan URL placeholder."
    );

  }

}


/* =========================================================
   REQUEST API
========================================================= */

async function apiRequest(
  action,
  data = {}
) {

  validateApiUrl();


  if (!action) {

    throw new Error(
      "Action API tidak boleh kosong."
    );

  }


  const controller =
    new AbortController();


  const timeout =
    setTimeout(
      function () {

        controller.abort();

      },
      API_CONFIG.timeout
    );


  try {

    /*
     * ==========================================
     * PAYLOAD
     * ==========================================
     */

    const payload = {

      action:
        action,

      ...data

    };


    const body =
      JSON.stringify(
        payload
      );


    console.log(
      "[TradingAPI] POST",
    );

    console.log(
      "Action:",
      action
    );

    console.log(
      "Payload:",
      payload
    );


    /*
     * ==========================================
     * FETCH
     * ==========================================
     */

    const response =
      await fetch(
        API_URL,
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              API_CONFIG.contentType

          },

          body:
            body,

          signal:
            controller.signal

        }
      );


    /*
     * ==========================================
     * HTTP STATUS
     * ==========================================
     */

    if (!response.ok) {

      throw new Error(
        "HTTP Error " +
        response.status +
        " " +
        response.statusText
      );

    }


    /*
     * ==========================================
     * RESPONSE
     * ==========================================
     */

    const text =
      await response.text();


    console.log(
      "[TradingAPI] RESPONSE:",
      text
    );


    if (
      !text ||
      !text.trim()
    ) {

      throw new Error(
        "Google Apps Script mengembalikan response kosong."
      );

    }


    /*
     * ==========================================
     * PARSE JSON
     * ==========================================
     */

    let result;


    try {

      result =
        JSON.parse(
          text
        );

    } catch (error) {

      console.error(
        "[TradingAPI] JSON PARSE ERROR"
      );

      console.error(
        text
      );


      throw new Error(
        "Response Google Apps Script bukan JSON yang valid."
      );

    }


    /*
     * ==========================================
     * BACKEND ERROR
     * ==========================================
     */

    if (
      result &&
      result.success === false
    ) {

      throw new Error(
        result.message ||
        "Google Apps Script mengembalikan error."
      );

    }


    /*
     * ==========================================
     * SUCCESS
     * ==========================================
     */

    return result;


  } catch (error) {

    /*
     * TIMEOUT
     */

    if (
      error &&
      error.name === "AbortError"
    ) {

      throw new Error(
        "Request timeout setelah " +
        API_CONFIG.timeout +
        " ms. " +
        "Periksa koneksi dan deployment Apps Script."
      );

    }


    /*
     * NETWORK / CORS
     */

    if (
      error &&
      error instanceof TypeError
    ) {

      console.error(
        "[TradingAPI] NETWORK ERROR:",
        error
      );


      throw new Error(
        "Tidak dapat terhubung ke Google Apps Script. " +
        "Periksa URL Web App, deployment Apps Script, " +
        "akses Web App, dan koneksi internet."
      );

    }


    throw error;


  } finally {

    clearTimeout(
      timeout
    );

  }

}


/* =========================================================
   GET ALL DATA
========================================================= */

async function getAllData() {

  validateApiUrl();


  const controller =
    new AbortController();


  const timeout =
    setTimeout(
      function () {

        controller.abort();

      },
      API_CONFIG.timeout
    );


  try {

    console.log(
      "[TradingAPI] GET ALL DATA"
    );


    const response =
      await fetch(
        API_URL,
        {

          method:
            "GET",

          signal:
            controller.signal

        }
      );


    if (!response.ok) {

      throw new Error(
        "HTTP Error " +
        response.status +
        " " +
        response.statusText
      );

    }


    const text =
      await response.text();


    console.log(
      "[TradingAPI] GET RESPONSE:",
      text
    );


    if (
      !text ||
      !text.trim()
    ) {

      throw new Error(
        "Google Apps Script mengembalikan response kosong."
      );

    }


    let result;


    try {

      result =
        JSON.parse(
          text
        );

    } catch (error) {

      console.error(
        "[TradingAPI] GET JSON ERROR:",
        text
      );


      throw new Error(
        "Response Google Apps Script bukan JSON yang valid."
      );

    }


    if (
      result &&
      result.success === false
    ) {

      throw new Error(
        result.message ||
        "Gagal mengambil data dari Google Sheets."
      );

    }


    return result;


  } catch (error) {

    if (
      error &&
      error.name === "AbortError"
    ) {

      throw new Error(
        "Request timeout saat mengambil data trading."
      );

    }


    if (
      error &&
      error instanceof TypeError
    ) {

      throw new Error(
        "Tidak dapat terhubung ke Google Apps Script."
      );

    }


    throw error;


  } finally {

    clearTimeout(
      timeout
    );

  }

}


/* =========================================================
   EXTRACT DATA
========================================================= */

function extractData(
  result
) {

  if (
    result &&
    result.data
  ) {

    return result.data;

  }


  return result || {};

}


/* =========================================================
   GET TRANSACTIONS
========================================================= */

async function getTransactions() {

  const result =
    await getAllData();


  const data =
    extractData(
      result
    );


  if (
    Array.isArray(
      data.transaksi
    )
  ) {

    return data.transaksi;

  }


  if (
    Array.isArray(
      data.transactions
    )
  ) {

    return data.transactions;

  }


  return [];

}


/* =========================================================
   GET MODAL DATA
========================================================= */

async function getModalData() {

  const result =
    await getAllData();


  const data =
    extractData(
      result
    );


  if (
    Array.isArray(
      data.modal
    )
  ) {

    return data.modal;

  }


  return [];

}


/* =========================================================
   GET CAPITAL / SUMMARY
========================================================= */

async function getCapital() {

  const result =
    await getAllData();


  const data =
    extractData(
      result
    );


  if (
    data.summary
  ) {

    return data.summary;

  }


  if (
    result.capital
  ) {

    return result.capital;

  }


  return {};

}


/* =========================================================
   GET REPORT
========================================================= */

async function getReport() {

  const result =
    await getAllData();


  const data =
    extractData(
      result
    );


  if (
    data.summary
  ) {

    return data.summary;

  }


  if (
    result.report
  ) {

    return result.report;

  }


  return {};

}


/* =========================================================
   NORMALIZE TRANSACTION
========================================================= */

function normalizeTransactionData(
  transaction
) {

  if (
    !transaction ||
    typeof transaction !== "object"
  ) {

    throw new Error(
      "Data transaksi kosong."
    );

  }


  /*
   * TANGGAL
   */

  const tanggal =
    String(
      transaction.tanggal ??
      transaction.Tanggal ??
      ""
    )
    .trim();


  /*
   * SAHAM
   */

  const saham =
    String(
      transaction.saham ??
      transaction.Saham ??
      ""
    )
    .trim()
    .toUpperCase();


  /*
   * AKSI
   */

  const aksi =
    String(
      transaction.aksi ??
      transaction.Aksi ??
      ""
    )
    .trim()
    .toUpperCase();


  /*
   * HARGA
   */

  const harga =
    Number(
      transaction.harga ??
      transaction.Harga ??
      0
    );


  /*
   * LOT
   */

  const lot =
    Number(
      transaction.lot ??
      transaction.Lot ??
      0
    );


  /*
   * PROFIT / RUGI
   */

  let profitRugi =
    transaction.profitRugi;


  if (
    profitRugi === undefined ||
    profitRugi === null ||
    profitRugi === ""
  ) {

    profitRugi =
      transaction.hasil;

  }


  if (
    profitRugi === undefined ||
    profitRugi === null ||
    profitRugi === ""
  ) {

    profitRugi =
      transaction["Profit/Rugi"];

  }


  profitRugi =
    String(
      profitRugi ??
      ""
    )
    .trim()
    .toUpperCase();


  /*
   * NOMINAL
   */

  const nominal =
    Number(
      transaction.nominal ??
      transaction.Nominal ??
      0
    );


  /*
   * CATATAN
   */

  const catatan =
    String(
      transaction.catatan ??
      transaction.Catatan ??
      ""
    )
    .trim();


  /*
   * ID
   *
   * ID tidak ikut dikirim sebagai
   * data transaksi saat ADD.
   */

  const id =
    transaction.id ??
    transaction.ID ??
    "";


  return {

    id:
      id,

    tanggal:
      tanggal,

    saham:
      saham,

    aksi:
      aksi,

    harga:
      harga,

    lot:
      lot,

    profitRugi:
      profitRugi,

    nominal:
      nominal,

    catatan:
      catatan

  };

}


/* =========================================================
   VALIDATE TRANSACTION
========================================================= */

function validateTransactionData(
  transaction
) {

  /*
   * TANGGAL
   */

  if (
    !transaction.tanggal
  ) {

    throw new Error(
      "Tanggal transaksi wajib diisi."
    );

  }


  /*
   * SAHAM
   */

  if (
    !transaction.saham
  ) {

    throw new Error(
      "Kode saham wajib diisi."
    );

  }


  /*
   * AKSI
   */

  if (
    transaction.aksi !== "BUY" &&
    transaction.aksi !== "SELL"
  ) {

    throw new Error(
      "Aksi transaksi harus BUY atau SELL."
    );

  }


  /*
   * HARGA
   */

  if (
    !Number.isFinite(
      transaction.harga
    ) ||
    transaction.harga <= 0
  ) {

    throw new Error(
      "Harga harus lebih besar dari 0."
    );

  }


  /*
   * LOT
   */

  if (
    !Number.isFinite(
      transaction.lot
    ) ||
    transaction.lot <= 0
  ) {

    throw new Error(
      "Lot harus lebih besar dari 0."
    );

  }


  /*
   * PROFIT / RUGI
   */

  if (
    transaction.profitRugi !== "" &&
    transaction.profitRugi !== "PROFIT" &&
    transaction.profitRugi !== "RUGI"
  ) {

    throw new Error(
      "Profit/Rugi harus PROFIT atau RUGI."
    );

  }


  /*
   * NOMINAL
   */

  if (
    transaction.profitRugi !== "" &&
    (
      !Number.isFinite(
        transaction.nominal
      ) ||
      transaction.nominal <= 0
    )
  ) {

    throw new Error(
      "Nominal profit/rugi wajib lebih besar dari 0."
    );

  }


  /*
   * Jika tidak ada profit/rugi,
   * nominal dipaksa 0.
   */

  if (
    transaction.profitRugi === ""
  ) {

    transaction.nominal =
      0;

  }


  return true;

}


/* =========================================================
   ADD TRANSACTION
========================================================= */

async function addTransaction(
  transaction
) {

  const normalized =
    normalizeTransactionData(
      transaction
    );


  validateTransactionData(
    normalized
  );


  /*
   * ID tidak perlu dikirim.
   *
   * Google Apps Script yang membuat ID.
   */

  delete normalized.id;


  return await apiRequest(
    "transaction",
    normalized
  );

}


/* =========================================================
   UPDATE TRANSACTION
========================================================= */

async function updateTransaction(
  id,
  transaction
) {

  /*
   * VALIDASI ID
   */

  if (
    id === undefined ||
    id === null ||
    String(id).trim() === ""
  ) {

    throw new Error(
      "ID transaksi tidak ditemukan."
    );

  }


  const normalized =
    normalizeTransactionData(
      transaction
    );


  validateTransactionData(
    normalized
  );


  /*
   * ID harus dikirim ke backend.
   */

  const payload = {

    id:
      String(id).trim(),

    tanggal:
      normalized.tanggal,

    saham:
      normalized.saham,

    aksi:
      normalized.aksi,

    harga:
      normalized.harga,

    lot:
      normalized.lot,

    profitRugi:
      normalized.profitRugi,

    nominal:
      normalized.nominal,

    catatan:
      normalized.catatan

  };


  console.log(
    "[TradingAPI] UPDATE TRANSACTION:",
    payload
  );


  return await apiRequest(
    "update_transaction",
    payload
  );

}


/* =========================================================
   DELETE TRANSACTION
========================================================= */

async function deleteTransaction(
  id
) {

  if (
    id === undefined ||
    id === null ||
    String(id).trim() === ""
  ) {

    throw new Error(
      "ID transaksi tidak ditemukan."
    );

  }


  const payload = {

    id:
      String(id).trim()

  };


  console.log(
    "[TradingAPI] DELETE TRANSACTION:",
    payload
  );


  return await apiRequest(
    "delete_transaction",
    payload
  );

}


/* =========================================================
   ADD CAPITAL
========================================================= */

async function addCapital(
  amount,
  note = "",
  tanggal = ""
) {

  const nominal =
    Number(
      amount
    );


  if (
    !Number.isFinite(
      nominal
    ) ||
    nominal <= 0
  ) {

    throw new Error(
      "Nominal tambah modal tidak valid."
    );

  }


  const payload = {

    tanggal:
      tanggal ||
      getTodayString(),

    nominal:
      nominal,

    catatan:
      String(
        note || ""
      ).trim()

  };


  console.log(
    "[TradingAPI] ADD CAPITAL:",
    payload
  );


  return await apiRequest(
    "add_modal",
    payload
  );

}


/* =========================================================
   WITHDRAW CAPITAL
========================================================= */

async function withdrawCapital(
  amount,
  note = "",
  tanggal = ""
) {

  const nominal =
    Number(
      amount
    );


  if (
    !Number.isFinite(
      nominal
    ) ||
    nominal <= 0
  ) {

    throw new Error(
      "Nominal penarikan tidak valid."
    );

  }


  const payload = {

    tanggal:
      tanggal ||
      getTodayString(),

    nominal:
      nominal,

    catatan:
      String(
        note || ""
      ).trim()

  };


  console.log(
    "[TradingAPI] WITHDRAW CAPITAL:",
    payload
  );


  return await apiRequest(
    "withdraw_modal",
    payload
  );

}


/* =========================================================
   GENERIC POST
========================================================= */

async function apiPost(
  action,
  data = {}
) {

  return await apiRequest(
    action,
    data
  );

}


/* =========================================================
   GENERIC GET
========================================================= */

async function apiGet(
  action = "",
  data = {}
) {

  return await getAllData();

}


/* =========================================================
   TODAY STRING
========================================================= */

function getTodayString() {

  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() + 1
    )
    .padStart(
      2,
      "0"
    );


  const day =
    String(
      now.getDate()
    )
    .padStart(
      2,
      "0"
    );


  return (
    year +
    "-" +
    month +
    "-" +
    day
  );

}


/* =========================================================
   TEST API
========================================================= */

async function testApiConnection() {

  try {

    const result =
      await getAllData();


    console.log(
      "========================================"
    );

    console.log(
      "[TradingAPI] CONNECTION OK"
    );

    console.log(
      result
    );

    console.log(
      "========================================"
    );


    return true;

  } catch (error) {

    console.error(
      "========================================"
    );

    console.error(
      "[TradingAPI] CONNECTION FAILED"
    );

    console.error(
      error
    );

    console.error(
      "========================================"
    );


    return false;

  }

}


/* =========================================================
   CHECK API
========================================================= */

async function checkApiConnection() {

  try {

    const result =
      await getAllData();


    return {

      success:
        true,

      message:
        "Google Apps Script terhubung.",

      data:
        extractData(
          result
        )

    };

  } catch (error) {

    return {

      success:
        false,

      message:
        getApiErrorMessage(
          error
        ),

      data:
        null

    };

  }

}


/* =========================================================
   ERROR MESSAGE
========================================================= */

function getApiErrorMessage(
  error
) {

  if (!error) {

    return "Terjadi kesalahan.";

  }


  if (
    typeof error === "string"
  ) {

    return error;

  }


  if (
    error.message
  ) {

    return error.message;

  }


  return String(
    error
  );

}


/* =========================================================
   DEBUG API
========================================================= */

function debugApi() {

  console.log(
    "========================================"
  );

  console.log(
    "TRADING JOURNAL API"
  );

  console.log(
    "========================================"
  );

  console.log(
    "API URL:",
    API_URL
  );

  console.log(
    "Timeout:",
    API_CONFIG.timeout
  );

  console.log(
    "Content-Type:",
    API_CONFIG.contentType
  );

  console.log(
    "TRANSAKSI FIELDS:",
    TRANSACTION_FIELDS
  );

  console.log(
    "MODAL FIELDS:",
    MODAL_FIELDS
  );

  console.log(
    "========================================"
  );

}


/* =========================================================
   GLOBAL API OBJECT
========================================================= */

window.TradingAPI = {

  /*
   * CORE
   */

  request:
    apiRequest,

  post:
    apiPost,

  get:
    apiGet,


  /*
   * DATA
   */

  getAllData:
    getAllData,

  getTransactions:
    getTransactions,

  getModalData:
    getModalData,

  getCapital:
    getCapital,

  getReport:
    getReport,


  /*
   * TRANSAKSI
   */

  addTransaction:
    addTransaction,

  updateTransaction:
    updateTransaction,

  deleteTransaction:
    deleteTransaction,


  /*
   * MODAL
   */

  addCapital:
    addCapital,

  withdrawCapital:
    withdrawCapital,


  /*
   * TEST
   */

  test:
    testApiConnection,

  check:
    checkApiConnection,

  debug:
    debugApi,


  /*
   * ERROR
   */

  errorMessage:
    getApiErrorMessage

};


/* =========================================================
   GLOBAL SHORTCUT
========================================================= */

window.testTradingAPI =
  testApiConnection;


window.debugTradingAPI =
  debugApi;


/* =========================================================
   INITIAL LOG
========================================================= */

console.log(
  "========================================"
);

console.log(
  "[TradingAPI] FINAL VERSION LOADED"
);

console.log(
  "[TradingAPI] JSON REQUEST: ENABLED"
);

console.log(
  "[TradingAPI] ADD: ENABLED"
);

console.log(
  "[TradingAPI] EDIT: ENABLED"
);

console.log(
  "[TradingAPI] DELETE: ENABLED"
);

console.log(
  "[TradingAPI] MODAL: ENABLED"
);

console.log(
  "[TradingAPI] TRANSAKSI SHEET: 9 COLUMNS"
);

console.log(
  "[TradingAPI] MODAL SHEET: 5 COLUMNS"
);

console.log(
  "========================================"
);
