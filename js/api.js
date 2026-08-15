/* =========================================================
   TRADING JOURNAL
   api.js
   VERSION: STAGE 2
   JSON REQUEST + EDIT + DELETE
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

  timeout: 30000,

  contentType:
    "text/plain;charset=UTF-8"

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
    API_URL.includes("GANTI_DENGAN")
  ) {

    throw new Error(
      "API_URL masih menggunakan URL placeholder."
    );

  }

}


/* =========================================================
   API REQUEST
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

    const payload = {

      action:
        action,

      ...data

    };


    const body =
      JSON.stringify(payload);


    console.log(
      "[TradingAPI] POST:",
      payload
    );


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


    let result;


    try {

      result =
        JSON.parse(text);

    } catch (parseError) {

      console.error(
        "[TradingAPI] JSON PARSE ERROR:",
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
        "Google Apps Script mengembalikan error."
      );

    }


    return result;


  } catch (error) {

    if (
      error &&
      error.name === "AbortError"
    ) {

      throw new Error(
        "Request timeout setelah " +
        API_CONFIG.timeout +
        " ms."
      );

    }


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
        "Periksa URL Web App, deployment Apps Script, akses Web App, dan koneksi internet."
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
        JSON.parse(text);

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
   GET TRANSACTIONS
========================================================= */

async function getTransactions() {

  const result =
    await getAllData();


  const data =
    result?.data ||
    result;


  if (
    Array.isArray(
      data?.transaksi
    )
  ) {

    return data.transaksi;

  }


  if (
    Array.isArray(
      data?.transactions
    )
  ) {

    return data.transactions;

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
    result?.data ||
    result;


  if (
    data?.summary
  ) {

    return data.summary;

  }


  if (
    result?.capital
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
    result?.data ||
    result;


  if (
    data?.summary
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


  const tanggal =
    String(
      transaction.tanggal ||
      transaction.Tanggal ||
      ""
    ).trim();


  const saham =
    String(
      transaction.saham ||
      transaction.Saham ||
      ""
    )
    .trim()
    .toUpperCase();


  const aksi =
    String(
      transaction.aksi ||
      transaction.Aksi ||
      ""
    )
    .trim()
    .toUpperCase();


  const harga =
    Number(
      transaction.harga ??
      transaction.Harga
    ) || 0;


  const lot =
    Number(
      transaction.lot ??
      transaction.Lot
    ) || 0;


  let profitRugi =
    transaction.profitRugi;


  if (
    profitRugi === undefined ||
    profitRugi === null ||
    profitRugi === ""
  ) {

    profitRugi =
      transaction.hasil ??
      transaction["Profit/Rugi"] ??
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
      transaction.nominal ??
      transaction.Nominal
    ) || 0;


  const catatan =
    String(
      transaction.catatan ??
      transaction.Catatan ??
      ""
    ).trim();


  return {

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

  if (!transaction.tanggal) {

    throw new Error(
      "Tanggal transaksi wajib diisi."
    );

  }


  if (!transaction.saham) {

    throw new Error(
      "Kode saham wajib diisi."
    );

  }


  if (
    transaction.aksi !== "BUY" &&
    transaction.aksi !== "SELL"
  ) {

    throw new Error(
      "Aksi transaksi harus BUY atau SELL."
    );

  }


  if (
    !Number.isFinite(transaction.harga) ||
    transaction.harga <= 0
  ) {

    throw new Error(
      "Harga harus lebih besar dari 0."
    );

  }


  if (
    !Number.isFinite(transaction.lot) ||
    transaction.lot <= 0
  ) {

    throw new Error(
      "Lot harus lebih besar dari 0."
    );

  }


  if (
    transaction.profitRugi !== "" &&
    transaction.profitRugi !== "PROFIT" &&
    transaction.profitRugi !== "RUGI"
  ) {

    throw new Error(
      "Hasil harus PROFIT atau RUGI."
    );

  }


  if (
    transaction.profitRugi !== "" &&
    (
      !Number.isFinite(transaction.nominal) ||
      transaction.nominal <= 0
    )
  ) {

    throw new Error(
      "Nominal profit/rugi wajib lebih besar dari 0."
    );

  }

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

  if (
    id === undefined ||
    id === null ||
    id === ""
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


  return await apiRequest(
    "update_transaction",
    {

      id:
        id,

      ...normalized

    }
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
    id === ""
  ) {

    throw new Error(
      "ID transaksi tidak ditemukan."
    );

  }


  return await apiRequest(
    "delete_transaction",
    {

      id:
        id

    }
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
    Number(amount);


  if (
    !Number.isFinite(nominal) ||
    nominal <= 0
  ) {

    throw new Error(
      "Nominal tambah modal tidak valid."
    );

  }


  return await apiRequest(
    "add_modal",
    {

      tanggal:
        tanggal ||
        getTodayString(),

      nominal:
        nominal,

      catatan:
        String(
          note || ""
        ).trim()

    }
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
    Number(amount);


  if (
    !Number.isFinite(nominal) ||
    nominal <= 0
  ) {

    throw new Error(
      "Nominal penarikan tidak valid."
    );

  }


  return await apiRequest(
    "withdraw_modal",
    {

      tanggal:
        tanggal ||
        getTodayString(),

      nominal:
        nominal,

      catatan:
        String(
          note || ""
        ).trim()

    }
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
   TODAY
========================================================= */

function getTodayString() {

  const now =
    new Date();


  return (
    now.getFullYear() +
    "-" +
    String(
      now.getMonth() + 1
    ).padStart(2, "0") +
    "-" +
    String(
      now.getDate()
    ).padStart(2, "0")
  );

}


/* =========================================================
   TEST
========================================================= */

async function testApiConnection() {

  try {

    await getAllData();

    console.log(
      "[TradingAPI] Connection OK"
    );

    return true;

  } catch (error) {

    console.error(
      "[TradingAPI] Connection FAILED:",
      error
    );

    return false;

  }

}


/* =========================================================
   CHECK
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
        result?.data ||
        {}

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
   ERROR
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


  return String(error);

}


/* =========================================================
   DEBUG
========================================================= */

function debugApi() {

  console.log(
    "========================================"
  );

  console.log(
    "TRADING JOURNAL API - STAGE 2"
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
   GLOBAL API
========================================================= */

window.TradingAPI = {

  request:
    apiRequest,

  post:
    apiPost,

  get:
    apiGet,


  getAllData:
    getAllData,

  getTransactions:
    getTransactions,

  getCapital:
    getCapital,

  getReport:
    getReport,


  addTransaction:
    addTransaction,

  updateTransaction:
    updateTransaction,

  deleteTransaction:
    deleteTransaction,


  addCapital:
    addCapital,

  withdrawCapital:
    withdrawCapital,


  test:
    testApiConnection,

  check:
    checkApiConnection,

  debug:
    debugApi,

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


console.log(
  "[TradingAPI] Stage 2 loaded."
);

console.log(
  "[TradingAPI] Edit/Delete ENABLED."
);
