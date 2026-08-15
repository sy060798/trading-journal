/* =========================================================
   TRADING JOURNAL
   API CONNECTION
   Google Apps Script + Google Sheets

   VERSION:
   FIX JSON REQUEST

   Backend Code.gs menggunakan:

   doGet()
   doPost()

   doPost membaca:

   JSON.parse(e.postData.contents)

   Maka frontend WAJIB mengirim JSON.
========================================================= */

"use strict";


/* =========================================================
   GOOGLE APPS SCRIPT URL
========================================================= */

const API_URL =
  "https://script.google.com/macros/s/AKfycbypUxWIp8OemScOwiqDeLnnSjpfGb3bVZHw_pzPMIWFSUWiURc6rseuRi5bOZ9LFMGK_A/exec";


/* =========================================================
   BASIC CONFIG
========================================================= */

const API_CONFIG = {

  timeout: 30000,

  /*
   * text/plain digunakan supaya request
   * tidak memicu preflight CORS seperti
   * application/json pada beberapa kondisi
   * Google Apps Script.
   *
   * Isi body tetap JSON.
   */

  contentType:
    "text/plain;charset=UTF-8"

};


/* =========================================================
   CHECK API URL
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
    API_URL.includes("GANTI_DENGAN")
  ) {

    throw new Error(
      "API_URL masih menggunakan URL placeholder."
    );

  }

}


/* =========================================================
   REQUEST HELPER
========================================================= */

/**
 * Mengirim POST JSON ke Google Apps Script.
 *
 * Backend:
 *
 * function doPost(e) {
 *
 *   const body =
 *     JSON.parse(
 *       e.postData.contents
 *     );
 *
 * }
 */

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
     * BODY JSON
     * ==========================================
     */

    const payload = {

      action:
        action,

      ...data

    };


    const body =
      JSON.stringify(payload);


    console.log(
      "[TradingAPI] POST:",
      action,
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

            /*
             * text/plain sengaja digunakan.
             *
             * Body tetap JSON.
             *
             * Apps Script tetap bisa membaca:
             *
             * JSON.parse(
             *   e.postData.contents
             * )
             */

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
     * RESPONSE TEXT
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

    } catch (parseError) {

      console.error(
        "[TradingAPI] JSON PARSE ERROR"
      );

      console.error(
        "Response:",
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
     * ==========================================
     * TIMEOUT
     * ==========================================
     */

    if (
      error &&
      error.name === "AbortError"
    ) {

      throw new Error(
        "Request timeout setelah " +
        API_CONFIG.timeout +
        " ms. Periksa koneksi dan deployment Apps Script."
      );

    }


    /*
     * ==========================================
     * NETWORK ERROR
     * ==========================================
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
        "Periksa URL Web App, deployment, akses Web App, dan koneksi internet."
      );

    }


    /*
     * ==========================================
     * PASS ERROR
     * ==========================================
     */

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

/**
 * Code.gs doGet() mengembalikan:
 *
 * {
 *   success: true,
 *   data: {
 *     transaksi: [],
 *     modal: [],
 *     summary: {}
 *   }
 * }
 *
 * Karena doGet tidak membutuhkan action,
 * kita gunakan fetch GET langsung.
 */

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
        "GET response bukan JSON:",
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
   GET TRANSACTIONS
========================================================= */

async function getTransactions() {

  const result =
    await getAllData();


  const data =
    result?.data;


  if (
    data &&
    Array.isArray(
      data.transaksi
    )
  ) {

    return data.transaksi;

  }


  /*
   * Fallback jika backend suatu saat
   * mengembalikan transactions.
   */

  if (
    Array.isArray(
      result?.transactions
    )
  ) {

    return result.transactions;

  }


  return [];

}


/* =========================================================
   GET CAPITAL
========================================================= */

async function getCapital() {

  const result =
    await getAllData();


  const data =
    result?.data;


  /*
   * Backend sekarang:
   *
   * data.summary
   */

  if (
    data &&
    data.summary
  ) {

    return data.summary;

  }


  /*
   * Fallback
   */

  if (
    result?.capital
  ) {

    return result.capital;

  }


  if (
    result?.data?.capital
  ) {

    return result.data.capital;

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
    result?.data;


  if (
    data &&
    data.summary
  ) {

    return data.summary;

  }


  if (
    result?.report
  ) {

    return result.report;

  }


  return {};

}


/* =========================================================
   ADD TRANSACTION
========================================================= */

/**
 * Backend Code.gs:
 *
 * case 'transaction':
 *   result = addTransaction(body);
 *
 *
 * Jadi frontend HARUS mengirim:
 *
 * {
 *   action: "transaction",
 *   tanggal: "...",
 *   saham: "...",
 *   aksi: "...",
 *   harga: ...,
 *   lot: ...,
 *   profitRugi: "...",
 *   nominal: ...,
 *   catatan: "..."
 * }
 */

async function addTransaction(
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
   * ==========================================
   * NORMALISASI
   * ==========================================
   */

  const tanggal =
    transaction.tanggal ||
    "";

  const saham =
    String(
      transaction.saham ||
      ""
    )
    .trim()
    .toUpperCase();


  const aksi =
    String(
      transaction.aksi ||
      ""
    )
    .trim()
    .toUpperCase();


  const harga =
    Number(
      transaction.harga
    ) || 0;


  const lot =
    Number(
      transaction.lot
    ) || 0;


  /*
   * trading.js menggunakan "hasil"
   * sedangkan Code.gs menggunakan
   * "profitRugi".
   */

  let profitRugi =
    transaction.profitRugi;


  if (
    profitRugi === undefined ||
    profitRugi === null ||
    profitRugi === ""
  ) {

    profitRugi =
      transaction.hasil ||
      "";

  }


  profitRugi =
    String(
      profitRugi
    )
    .trim()
    .toUpperCase();


  const nominal =
    Number(
      transaction.nominal
    ) || 0;


  const catatan =
    String(
      transaction.catatan ||
      ""
    )
    .trim();


  /*
   * ==========================================
   * VALIDASI FRONTEND
   * ==========================================
   */

  if (!tanggal) {

    throw new Error(
      "Tanggal transaksi wajib diisi."
    );

  }


  if (!saham) {

    throw new Error(
      "Kode saham wajib diisi."
    );

  }


  if (
    aksi !== "BUY" &&
    aksi !== "SELL"
  ) {

    throw new Error(
      "Aksi transaksi harus BUY atau SELL."
    );

  }


  if (
    !Number.isFinite(harga) ||
    harga <= 0
  ) {

    throw new Error(
      "Harga harus lebih besar dari 0."
    );

  }


  if (
    !Number.isFinite(lot) ||
    lot <= 0
  ) {

    throw new Error(
      "Lot harus lebih besar dari 0."
    );

  }


  if (
    profitRugi !== "" &&
    profitRugi !== "PROFIT" &&
    profitRugi !== "RUGI"
  ) {

    throw new Error(
      "Hasil harus PROFIT atau RUGI."
    );

  }


  if (
    profitRugi !== "" &&
    nominal <= 0
  ) {

    throw new Error(
      "Nominal wajib lebih besar dari 0 jika PROFIT/RUGI dipilih."
    );

  }


  /*
   * ==========================================
   * KIRIM KE APPS SCRIPT
   * ==========================================
   */

  const result =
    await apiRequest(
      "transaction",
      {

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

      }
    );


  return result;

}


/* =========================================================
   ADD CAPITAL
========================================================= */

/**
 * Backend:
 *
 * case 'add_modal':
 *   result = addModal(body);
 */

async function addCapital(
  amount,
  note = ""
) {

  amount =
    Number(
      amount
    );


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    throw new Error(
      "Nominal tambah modal tidak valid."
    );

  }


  /*
   * Gunakan tanggal hari ini.
   */

  const tanggal =
    getTodayString();


  const result =
    await apiRequest(
      "add_modal",
      {

        tanggal:
          tanggal,

        nominal:
          amount,

        catatan:
          String(
            note || ""
          ).trim()

      }
    );


  return result;

}


/* =========================================================
   WITHDRAW CAPITAL
========================================================= */

/**
 * Backend:
 *
 * case 'withdraw_modal':
 *   result = withdrawModal(body);
 */

async function withdrawCapital(
  amount,
  note = ""
) {

  amount =
    Number(
      amount
    );


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    throw new Error(
      "Nominal penarikan tidak valid."
    );

  }


  /*
   * Gunakan tanggal hari ini.
   */

  const tanggal =
    getTodayString();


  const result =
    await apiRequest(
      "withdraw_modal",
      {

        tanggal:
          tanggal,

        nominal:
          amount,

        catatan:
          String(
            note || ""
          ).trim()

      }
    );


  return result;

}


/* =========================================================
   DELETE TRANSACTION
========================================================= */

/**
 * Code.gs yang kamu kirim BELUM memiliki
 * action deleteTransaction.
 *
 * Jadi jangan mengirim request palsu.
 */

async function deleteTransaction(
  id
) {

  if (
    id === undefined ||
    id === null ||
    id === ""
  ) {

    throw new Error(
      "ID transaksi tidak ditemukan."
    );

  }


  throw new Error(
    "Fitur hapus transaksi belum tersedia di Apps Script."
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

/**
 * Karena doGet() backend mengembalikan
 * seluruh data sekaligus, generic GET
 * mengambil seluruh data.
 */

async function apiGet(
  action = "",
  data = {}
) {

  /*
   * action/data disimpan sebagai parameter
   * API helper agar kompatibel dengan kode
   * frontend lama.
   *
   * Namun Code.gs doGet tidak membutuhkan
   * parameter tersebut.
   */

  return await getAllData();

}


/* =========================================================
   TODAY STRING
========================================================= */

/**
 * Hasil:
 *
 * 2026-08-15
 */

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
   CONNECTION TEST
========================================================= */

async function testApiConnection() {

  try {

    console.log(
      "========================================"
    );

    console.log(
      "TRADING JOURNAL API TEST"
    );

    console.log(
      "URL:",
      API_URL
    );


    const result =
      await getAllData();


    console.log(
      "Connection: OK"
    );


    console.log(
      "Response:",
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
      "TRADING JOURNAL API TEST"
    );

    console.error(
      "Connection: FAILED"
    );

    console.error(
      "Error:",
      error
    );

    console.error(
      "========================================"
    );


    return false;

  }

}


/* =========================================================
   GET API STATUS
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
        result?.data || {}

    };

  } catch (error) {

    return {

      success:
        false,

      message:
        getApiErrorMessage(error)

    };

  }

}


/* =========================================================
   FORMAT ERROR
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
   API DEBUG
========================================================= */

function debugApi() {

  console.log(
    "========================================"
  );

  console.log(
    "TRADING JOURNAL API"
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
    "========================================"
  );

}


/* =========================================================
   GLOBAL API OBJECT
========================================================= */

window.TradingAPI = {

  /*
   * Core
   */

  request:
    apiRequest,

  post:
    apiPost,

  get:
    apiGet,


  /*
   * Data
   */

  getAllData:
    getAllData,

  getTransactions:
    getTransactions,

  getCapital:
    getCapital,

  getReport:
    getReport,


  /*
   * Transactions
   */

  addTransaction:
    addTransaction,

  deleteTransaction:
    deleteTransaction,


  /*
   * Capital
   */

  addCapital:
    addCapital,

  withdrawCapital:
    withdrawCapital,


  /*
   * Testing
   */

  test:
    testApiConnection,

  check:
    checkApiConnection,

  debug:
    debugApi,


  /*
   * Error
   */

  errorMessage:
    getApiErrorMessage

};


/* =========================================================
   GLOBAL SHORTCUTS
========================================================= */

window.testTradingAPI =
  testApiConnection;


window.debugTradingAPI =
  debugApi;


/* =========================================================
   INITIAL DEBUG
========================================================= */

console.log(
  "[TradingAPI] API loaded."
);

console.log(
  "[TradingAPI] URL:",
  API_URL
);

console.log(
  "[TradingAPI] JSON mode: ENABLED"
);
