/* =========================================================
   TRADING JOURNAL
   API CONNECTION
   Google Apps Script + Google Sheets

   FILE:
   js/api.js

   VERSION:
   FULL UPDATE

   SUPPORT:
   - index.html
   - trading.js
   - laporan.html
   - laporan.js
   - Google Apps Script doGet()
   - Google Apps Script doPost()

   BACKEND EXPECTED:

   doGet()
   doPost()

   doPost membaca:

   JSON.parse(e.postData.contents)

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
   * Content-Type text/plain membantu menghindari
   * preflight CORS pada Google Apps Script.
   */

  contentType:
    "text/plain;charset=UTF-8",

  /*
   * Cache GET singkat.
   * Setelah transaksi/modal berhasil disimpan,
   * cache akan langsung dibersihkan.
   */

  cacheDuration:
    5000

};


/* =========================================================
   INTERNAL STATE
========================================================= */

let apiDataCache =
  null;

let apiDataCacheTime =
  0;


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


  if (
    !API_URL.startsWith(
      "https://"
    )
  ) {

    throw new Error(
      "API_URL harus menggunakan HTTPS."
    );

  }

}


/* =========================================================
   CLEAR CACHE
========================================================= */

function clearApiCache() {

  apiDataCache =
    null;

  apiDataCacheTime =
    0;

}


/* =========================================================
   GET CACHE
========================================================= */

function getCachedApiData() {

  if (
    !apiDataCache
  ) {

    return null;

  }


  const age =
    Date.now() -
    apiDataCacheTime;


  if (
    age >
    API_CONFIG.cacheDuration
  ) {

    return null;

  }


  return apiDataCache;

}


/* =========================================================
   SET CACHE
========================================================= */

function setCachedApiData(
  data
) {

  apiDataCache =
    data;

  apiDataCacheTime =
    Date.now();

}


/* =========================================================
   API REQUEST
========================================================= */

/**
 * POST JSON ke Google Apps Script.
 *
 * Contoh:
 *
 * apiRequest(
 *   "transaction",
 *   {
 *     tanggal: "...",
 *     saham: "BBCA",
 *     aksi: "BUY",
 *     harga: 9000,
 *     lot: 1,
 *     profitRugi: "PROFIT",
 *     nominal: 100000,
 *     catatan: "..."
 *   }
 * );
 */

async function apiRequest(
  action,
  data = {}
) {

  validateApiUrl();


  if (
    !action ||
    typeof action !== "string"
  ) {

    throw new Error(
      "Action API tidak boleh kosong."
    );

  }


  const controller =
    new AbortController();


  const timeout =
    setTimeout(
      () => {

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

      ...(
        data &&
        typeof data === "object"
          ? data
          : {}
      )

    };


    const body =
      JSON.stringify(
        payload
      );


    console.log(
      "[TradingAPI] POST ACTION:",
      action
    );


    console.log(
      "[TradingAPI] POST PAYLOAD:",
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
     * HTTP ERROR
     * ==========================================
     */

    if (
      !response.ok
    ) {

      throw new Error(
        "HTTP Error " +
        response.status +
        " " +
        (
          response.statusText ||
          ""
        )
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
      "[TradingAPI] POST RESPONSE:",
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

    } catch (
      parseError
    ) {

      console.error(
        "[TradingAPI] JSON PARSE ERROR:",
        parseError
      );


      console.error(
        "[TradingAPI] RAW RESPONSE:",
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

    clearApiCache();


    return result;


  } catch (
    error
  ) {

    /*
     * ==========================================
     * TIMEOUT
     * ==========================================
     */

    if (
      error &&
      error.name ===
        "AbortError"
    ) {

      throw new Error(
        "Request timeout setelah " +
        API_CONFIG.timeout +
        " ms. Periksa koneksi dan deployment Apps Script."
      );

    }


    /*
     * ==========================================
     * NETWORK / FETCH ERROR
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
 * Mengambil seluruh data dari Google Apps Script.
 *
 * Expected:
 *
 * {
 *   success: true,
 *   data: {
 *     transaksi: [],
 *     modal: [],
 *     summary: {}
 *   }
 * }
 */

async function getAllData(
  forceRefresh = false
) {

  validateApiUrl();


  /*
   * ==========================================
   * CACHE
   * ==========================================
   */

  if (
    !forceRefresh
  ) {

    const cached =
      getCachedApiData();


    if (
      cached
    ) {

      console.log(
        "[TradingAPI] GET: menggunakan cache"
      );


      return cached;

    }

  }


  const controller =
    new AbortController();


  const timeout =
    setTimeout(
      () => {

        controller.abort();

      },
      API_CONFIG.timeout
    );


  try {

    console.log(
      "[TradingAPI] GET ALL DATA"
    );


    /*
     * ==========================================
     * FETCH GET
     * ==========================================
     */

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


    /*
     * ==========================================
     * HTTP ERROR
     * ==========================================
     */

    if (
      !response.ok
    ) {

      throw new Error(
        "HTTP Error " +
        response.status +
        " " +
        (
          response.statusText ||
          ""
        )
      );

    }


    /*
     * ==========================================
     * TEXT
     * ==========================================
     */

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


    /*
     * ==========================================
     * JSON
     * ==========================================
     */

    let result;


    try {

      result =
        JSON.parse(
          text
        );

    } catch (
      parseError
    ) {

      console.error(
        "[TradingAPI] GET JSON ERROR:",
        parseError
      );


      console.error(
        "[TradingAPI] RAW GET RESPONSE:",
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
        "Gagal mengambil data dari Google Sheets."
      );

    }


    /*
     * ==========================================
     * CACHE
     * ==========================================
     */

    setCachedApiData(
      result
    );


    return result;


  } catch (
    error
  ) {

    if (
      error &&
      error.name ===
        "AbortError"
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
   FORCE REFRESH
========================================================= */

async function refreshAllData() {

  clearApiCache();


  return await getAllData(
    true
  );

}


/* =========================================================
   GET TRANSACTIONS
========================================================= */

async function getTransactions() {

  const result =
    await getAllData();


  /*
   * Format utama:
   *
   * result.data.transaksi
   */

  if (
    result &&
    result.data &&
    Array.isArray(
      result.data.transaksi
    )
  ) {

    return result.data.transaksi;

  }


  /*
   * Fallback:
   *
   * result.data.transactions
   */

  if (
    result &&
    result.data &&
    Array.isArray(
      result.data.transactions
    )
  ) {

    return result.data.transactions;

  }


  /*
   * Fallback:
   *
   * result.transactions
   */

  if (
    result &&
    Array.isArray(
      result.transactions
    )
  ) {

    return result.transactions;

  }


  /*
   * Fallback:
   *
   * result.data jika langsung array
   */

  if (
    result &&
    Array.isArray(
      result.data
    )
  ) {

    return result.data;

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
   * Format utama backend:
   *
   * data.summary
   */

  if (
    data &&
    data.summary &&
    typeof data.summary ===
      "object"
  ) {

    return data.summary;

  }


  /*
   * Fallback:
   *
   * data.capital
   */

  if (
    data &&
    data.capital &&
    typeof data.capital ===
      "object"
  ) {

    return data.capital;

  }


  /*
   * Fallback:
   *
   * result.capital
   */

  if (
    result &&
    result.capital &&
    typeof result.capital ===
      "object"
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
    result?.data;


  /*
   * Summary laporan.
   */

  if (
    data &&
    data.summary &&
    typeof data.summary ===
      "object"
  ) {

    return data.summary;

  }


  if (
    result &&
    result.report &&
    typeof result.report ===
      "object"
  ) {

    return result.report;

  }


  return {};

}


/* =========================================================
   ADD TRANSACTION
========================================================= */

/**
 * Kirim transaksi:
 *
 * action: transaction
 */

async function addTransaction(
  transaction
) {

  if (
    !transaction ||
    typeof transaction !==
      "object"
  ) {

    throw new Error(
      "Data transaksi kosong."
    );

  }


  /*
   * ==========================================
   * TANGGAL
   * ==========================================
   */

  const tanggal =
    transaction.tanggal ||
    "";


  /*
   * ==========================================
   * SAHAM
   * ==========================================
   */

  const saham =
    String(
      transaction.saham ||
      ""
    )
      .trim()
      .toUpperCase();


  /*
   * ==========================================
   * AKSI
   * ==========================================
   */

  const aksi =
    String(
      transaction.aksi ||
      ""
    )
      .trim()
      .toUpperCase();


  /*
   * ==========================================
   * HARGA
   * ==========================================
   */

  const harga =
    Number(
      transaction.harga
    );


  /*
   * ==========================================
   * LOT
   * ==========================================
   */

  const lot =
    Number(
      transaction.lot
    );


  /*
   * ==========================================
   * HASIL / PROFIT RUGI
   * ==========================================
   *
   * Mendukung:
   *
   * transaction.profitRugi
   *
   * transaction.hasil
   */

  let profitRugi =
    transaction.profitRugi;


  if (
    profitRugi ===
      undefined ||
    profitRugi ===
      null ||
    profitRugi ===
      ""
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


  /*
   * ==========================================
   * NOMINAL
   * ==========================================
   */

  const nominal =
    Number(
      transaction.nominal
    );


  /*
   * ==========================================
   * CATATAN
   * ==========================================
   */

  const catatan =
    String(
      transaction.catatan ||
      ""
    )
      .trim();


  /*
   * ==========================================
   * VALIDASI
   * ==========================================
   */

  if (
    !tanggal
  ) {

    throw new Error(
      "Tanggal transaksi wajib diisi."
    );

  }


  if (
    !saham
  ) {

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
    !Number.isFinite(
      harga
    ) ||
    harga <= 0
  ) {

    throw new Error(
      "Harga harus lebih besar dari 0."
    );

  }


  if (
    !Number.isFinite(
      lot
    ) ||
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


  /*
   * Jika hasil PROFIT/RUGI dipilih,
   * nominal harus valid.
   */

  if (
    profitRugi !== ""
  ) {

    if (
      !Number.isFinite(
        nominal
      ) ||
      nominal <= 0
    ) {

      throw new Error(
        "Nominal wajib lebih besar dari 0 jika PROFIT/RUGI dipilih."
      );

    }

  }


  /*
   * Jika nominal kosong,
   * gunakan 0.
   */

  const finalNominal =
    Number.isFinite(
      nominal
    )
      ? nominal
      : 0;


  /*
   * ==========================================
   * PAYLOAD
   * ==========================================
   */

  const payload = {

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

    /*
     * Tambahkan hasil juga.
     *
     * Ini membuat frontend lama dan backend
     * yang menggunakan salah satu nama tetap
     * kompatibel.
     */

    hasil:
      profitRugi,

    nominal:
      finalNominal,

    catatan:
      catatan

  };


  /*
   * ==========================================
   * SEND
   * ==========================================
   */

  const result =
    await apiRequest(
      "transaction",
      payload
    );


  /*
   * Cache dibersihkan oleh apiRequest.
   */

  return result;

}


/* =========================================================
   ADD CAPITAL
========================================================= */

/**
 * action:
 *
 * add_modal
 */

async function addCapital(
  amount,
  note = "",
  date = ""
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


  const tanggal =
    date ||
    getTodayString();


  const catatan =
    String(
      note ||
      ""
    )
      .trim();


  const result =
    await apiRequest(
      "add_modal",
      {

        tanggal:
          tanggal,

        nominal:
          nominal,

        catatan:
          catatan

      }
    );


  return result;

}


/* =========================================================
   WITHDRAW CAPITAL
========================================================= */

/**
 * action:
 *
 * withdraw_modal
 */

async function withdrawCapital(
  amount,
  note = "",
  date = ""
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


  const tanggal =
    date ||
    getTodayString();


  const catatan =
    String(
      note ||
      ""
    )
      .trim();


  const result =
    await apiRequest(
      "withdraw_modal",
      {

        tanggal:
          tanggal,

        nominal:
          nominal,

        catatan:
          catatan

      }
    );


  return result;

}


/* =========================================================
   DELETE TRANSACTION
========================================================= */

/**
 * Backend yang sekarang belum menyediakan:
 *
 * action: delete
 *
 * Karena itu tidak boleh mengirim request
 * delete yang belum didukung.
 */

async function deleteTransaction(
  id
) {

  if (
    id ===
      undefined ||
    id ===
      null ||
    id ===
      ""
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

async function apiGet(
  action = "",
  data = {}
) {

  /*
   * Backend doGet() mengembalikan
   * seluruh data.
   *
   * action/data dipertahankan hanya untuk
   * kompatibilitas frontend lama.
   */

  return await getAllData();

}


/* =========================================================
   TODAY STRING
========================================================= */

/**
 * Return:
 *
 * YYYY-MM-DD
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
   FORMAT DATE
========================================================= */

function getTodayDate() {

  return new Date();

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
      await refreshAllData();


    console.log(
      "CONNECTION: OK"
    );


    console.log(
      "RESPONSE:",
      result
    );


    console.log(
      "TRANSACTIONS:",
      await getTransactions()
    );


    console.log(
      "CAPITAL:",
      await getCapital()
    );


    console.log(
      "========================================"
    );


    return true;

  } catch (
    error
  ) {

    console.error(
      "========================================"
    );

    console.error(
      "TRADING JOURNAL API TEST"
    );

    console.error(
      "CONNECTION: FAILED"
    );

    console.error(
      "ERROR:",
      error
    );

    console.error(
      "========================================"
    );


    return false;

  }

}


/* =========================================================
   CHECK API CONNECTION
========================================================= */

async function checkApiConnection() {

  try {

    const result =
      await refreshAllData();


    return {

      success:
        true,

      message:
        "Google Apps Script terhubung.",

      data:
        result?.data ||
        {}

    };

  } catch (
    error
  ) {

    return {

      success:
        false,

      message:
        getApiErrorMessage(
          error
        )

    };

  }

}


/* =========================================================
   GET API STATUS
========================================================= */

async function getApiStatus() {

  try {

    const result =
      await getAllData();


    return {

      connected:
        true,

      success:
        result?.success !== false,

      message:
        "Google Apps Script terhubung.",

      data:
        result?.data ||
        {}

    };

  } catch (
    error
  ) {

    return {

      connected:
        false,

      success:
        false,

      message:
        getApiErrorMessage(
          error
        ),

      data:
        {}

    };

  }

}


/* =========================================================
   FORMAT ERROR
========================================================= */

function getApiErrorMessage(
  error
) {

  if (
    !error
  ) {

    return "Terjadi kesalahan.";

  }


  if (
    typeof error ===
      "string"
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
    "Cache Duration:",
    API_CONFIG.cacheDuration
  );

  console.log(
    "Cache Available:",
    Boolean(
      apiDataCache
    )
  );

  console.log(
    "========================================"
  );

}


/* =========================================================
   GET RAW DATA HELPERS
========================================================= */

/**
 * Helper tambahan supaya halaman lain
 * bisa langsung mengambil object data.
 */

async function getTransactionsData() {

  return await getTransactions();

}


async function getCapitalData() {

  return await getCapital();

}


async function getSummaryData() {

  const capital =
    await getCapital();


  return capital || {};

}


/* =========================================================
   GLOBAL API OBJECT
========================================================= */

window.TradingAPI = {

  /*
   * ========================================
   * CORE
   * ========================================
   */

  request:
    apiRequest,

  post:
    apiPost,

  get:
    apiGet,


  /*
   * ========================================
   * ALL DATA
   * ========================================
   */

  getAllData:
    getAllData,

  refreshAllData:
    refreshAllData,

  clearCache:
    clearApiCache,


  /*
   * ========================================
   * TRANSACTIONS
   * ========================================
   */

  getTransactions:
    getTransactions,

  getTransactionsData:
    getTransactionsData,

  addTransaction:
    addTransaction,

  deleteTransaction:
    deleteTransaction,


  /*
   * ========================================
   * CAPITAL
   * ========================================
   */

  getCapital:
    getCapital,

  getCapitalData:
    getCapitalData,

  getSummary:
    getSummaryData,

  addCapital:
    addCapital,

  withdrawCapital:
    withdrawCapital,


  /*
   * ========================================
   * REPORT
   * ========================================
   */

  getReport:
    getReport,


  /*
   * ========================================
   * CONNECTION
   * ========================================
   */

  test:
    testApiConnection,

  check:
    checkApiConnection,

  status:
    getApiStatus,


  /*
   * ========================================
   * DEBUG
   * ========================================
   */

  debug:
    debugApi,


  /*
   * ========================================
   * ERROR
   * ========================================
   */

  errorMessage:
    getApiErrorMessage,


  /*
   * ========================================
   * UTILITY
   * ========================================
   */

  today:
    getTodayString

};


/* =========================================================
   GLOBAL SHORTCUTS
========================================================= */

/*
 * API modern
 */

window.testTradingAPI =
  testApiConnection;


window.checkTradingAPI =
  checkApiConnection;


window.refreshTradingAPI =
  refreshAllData;


window.debugTradingAPI =
  debugApi;


/*
 * Compatibility dengan kode lama
 */

window.getTransactions =
  getTransactions;


window.getCapital =
  getCapital;


window.getReport =
  getReport;


window.addTransaction =
  addTransaction;


window.addCapital =
  addCapital;


window.withdrawCapital =
  withdrawCapital;


window.deleteTransaction =
  deleteTransaction;


/* =========================================================
   INITIAL DEBUG
========================================================= */

console.log(
  "[TradingAPI] API loaded."
);


console.log(
  "[TradingAPI] Google Apps Script URL:",
  API_URL
);


console.log(
  "[TradingAPI] JSON body mode: ENABLED"
);


console.log(
  "[TradingAPI] Content-Type:",
  API_CONFIG.contentType
);


console.log(
  "[TradingAPI] TradingAPI object: READY"
);
