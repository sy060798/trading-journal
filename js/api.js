/* =========================================================
   TRADING JOURNAL
   js/api.js

   VERSION: 1.0 FRESH

   GOOGLE SHEETS:
   TRANSAKSI
   ID | Tanggal | Saham | Aksi | Harga | Lot |
   Profit/Rugi | Nominal | Catatan

   MODAL
   ID | Tanggal | Jenis | Nominal | Catatan
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
   VALIDATE URL
========================================================= */

function validateApiUrl() {

  if (
    !API_URL ||
    typeof API_URL !== "string"
  ) {

    throw new Error(
      "API URL belum diisi."
    );

  }

  if (
    API_URL.includes("GANTI_DENGAN") ||
    API_URL.includes("YOUR_")
  ) {

    throw new Error(
      "API URL masih berupa placeholder."
    );

  }

}


/* =========================================================
   REQUEST POST
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


  const timeoutId =
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


    console.log(
      "[API] POST:",
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
            JSON.stringify(payload),

          signal:
            controller.signal

        }
      );


    if (!response.ok) {

      throw new Error(
        "HTTP " +
        response.status +
        ": " +
        response.statusText
      );

    }


    const text =
      await response.text();


    console.log(
      "[API] RESPONSE:",
      text
    );


    if (
      !text ||
      !text.trim()
    ) {

      throw new Error(
        "Response Google Sheets kosong."
      );

    }


    let result;


    try {

      result =
        JSON.parse(text);

    } catch (error) {

      console.error(
        "[API] RESPONSE BUKAN JSON:",
        text
      );

      throw new Error(
        "Response Google Apps Script bukan JSON yang valid."
      );

    }


    if (
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
        "Request timeout. Google Apps Script tidak merespons."
      );

    }


    if (
      error instanceof TypeError
    ) {

      console.error(
        "[API] NETWORK ERROR:",
        error
      );

      throw new Error(
        "Tidak dapat terhubung ke Google Apps Script. " +
        "Periksa URL Web App, deployment, izin akses, dan koneksi internet."
      );

    }


    throw error;


  } finally {

    clearTimeout(
      timeoutId
    );

  }

}


/* =========================================================
   REQUEST GET
========================================================= */

async function apiGetAll() {

  validateApiUrl();


  const controller =
    new AbortController();


  const timeoutId =
    setTimeout(
      function () {

        controller.abort();

      },
      API_CONFIG.timeout
    );


  try {

    console.log(
      "[API] GET ALL DATA"
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
        "HTTP " +
        response.status +
        ": " +
        response.statusText
      );

    }


    const text =
      await response.text();


    console.log(
      "[API] GET RESPONSE:",
      text
    );


    if (
      !text ||
      !text.trim()
    ) {

      throw new Error(
        "Response Google Sheets kosong."
      );

    }


    let result;


    try {

      result =
        JSON.parse(text);

    } catch (error) {

      console.error(
        "[API] GET JSON ERROR:",
        text
      );

      throw new Error(
        "Response Google Apps Script bukan JSON yang valid."
      );

    }


    if (
      result.success === false
    ) {

      throw new Error(
        result.message ||
        "Gagal mengambil data."
      );

    }


    return result;


  } catch (error) {

    if (
      error &&
      error.name === "AbortError"
    ) {

      throw new Error(
        "Request timeout saat mengambil data."
      );

    }


    if (
      error instanceof TypeError
    ) {

      throw new Error(
        "Tidak dapat terhubung ke Google Apps Script."
      );

    }


    throw error;


  } finally {

    clearTimeout(
      timeoutId
    );

  }

}


/* =========================================================
   NORMALIZE RESPONSE
========================================================= */

function getResponseData(
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
   GET ALL DATA
========================================================= */

async function getAllData() {

  const result =
    await apiGetAll();


  const data =
    getResponseData(
      result
    );


  return {

    transaksi:
      Array.isArray(
        data.transaksi
      )
        ? data.transaksi
        : [],

    modal:
      Array.isArray(
        data.modal
      )
        ? data.modal
        : [],

    summary:
      data.summary &&
      typeof data.summary === "object"
        ? data.summary
        : {}

  };

}


/* =========================================================
   GET TRANSACTIONS
========================================================= */

async function getTransactions() {

  const data =
    await getAllData();


  return data.transaksi;

}


/* =========================================================
   GET MODAL DATA
========================================================= */

async function getModalData() {

  const data =
    await getAllData();


  return data.modal;

}


/* =========================================================
   GET SUMMARY
========================================================= */

async function getSummary() {

  const data =
    await getAllData();


  return data.summary;

}


/* =========================================================
   NORMALIZE TRANSACTION
========================================================= */

function normalizeTransaction(
  data
) {

  if (
    !data ||
    typeof data !== "object"
  ) {

    throw new Error(
      "Data transaksi tidak ditemukan."
    );

  }


  const tanggal =
    String(
      data.tanggal ??
      data.Tanggal ??
      ""
    ).trim();


  const saham =
    String(
      data.saham ??
      data.Saham ??
      ""
    )
    .trim()
    .toUpperCase();


  const aksi =
    String(
      data.aksi ??
      data.Aksi ??
      ""
    )
    .trim()
    .toUpperCase();


  const harga =
    Number(
      data.harga ??
      data.Harga ??
      0
    );


  const lot =
    Number(
      data.lot ??
      data.Lot ??
      0
    );


  let profitRugi =
    data.profitRugi;


  if (
    profitRugi === undefined ||
    profitRugi === null
  ) {

    profitRugi =
      data["Profit/Rugi"];

  }


  profitRugi =
    String(
      profitRugi ?? ""
    )
    .trim()
    .toUpperCase();


  const nominal =
    Number(
      data.nominal ??
      data.Nominal ??
      0
    );


  const catatan =
    String(
      data.catatan ??
      data.Catatan ??
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

function validateTransaction(
  data
) {

  if (!data.tanggal) {

    throw new Error(
      "Tanggal wajib diisi."
    );

  }


  if (!data.saham) {

    throw new Error(
      "Saham wajib diisi."
    );

  }


  if (
    data.aksi !== "BUY" &&
    data.aksi !== "SELL"
  ) {

    throw new Error(
      "Aksi harus BUY atau SELL."
    );

  }


  if (
    !Number.isFinite(data.harga) ||
    data.harga <= 0
  ) {

    throw new Error(
      "Harga harus lebih besar dari 0."
    );

  }


  if (
    !Number.isFinite(data.lot) ||
    data.lot <= 0
  ) {

    throw new Error(
      "Lot harus lebih besar dari 0."
    );

  }


  if (
    data.profitRugi !== "" &&
    data.profitRugi !== "PROFIT" &&
    data.profitRugi !== "RUGI"
  ) {

    throw new Error(
      "Profit/Rugi harus PROFIT atau RUGI."
    );

  }


  if (
    data.profitRugi !== "" &&
    (
      !Number.isFinite(data.nominal) ||
      data.nominal <= 0
    )
  ) {

    throw new Error(
      "Nominal wajib diisi jika PROFIT/RUGI dipilih."
    );

  }


  if (
    data.profitRugi === ""
  ) {

    data.nominal = 0;

  }


  return true;

}


/* =========================================================
   ADD TRANSACTION
========================================================= */

async function addTransaction(
  data
) {

  const transaction =
    normalizeTransaction(
      data
    );


  validateTransaction(
    transaction
  );


  return await apiRequest(
    "addTransaction",
    {

      data:
        transaction

    }
  );

}


/* =========================================================
   UPDATE TRANSACTION
========================================================= */

async function updateTransaction(
  id,
  data
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


  const transaction =
    normalizeTransaction(
      data
    );


  validateTransaction(
    transaction
  );


  return await apiRequest(
    "updateTransaction",
    {

      id:
        String(id).trim(),

      data:
        transaction

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
    String(id).trim() === ""
  ) {

    throw new Error(
      "ID transaksi tidak ditemukan."
    );

  }


  return await apiRequest(
    "deleteTransaction",
    {

      id:
        String(id).trim()

    }
  );

}


/* =========================================================
   ADD MODAL
========================================================= */

async function addCapital(
  nominal,
  catatan = "",
  tanggal = ""
) {

  const amount =
    Number(
      nominal
    );


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    throw new Error(
      "Nominal tambah modal harus lebih besar dari 0."
    );

  }


  return await apiRequest(
    "addCapital",
    {

      data: {

        tanggal:
          tanggal ||
          getTodayString(),

        nominal:
          amount,

        catatan:
          String(
            catatan || ""
          ).trim()

      }

    }
  );

}


/* =========================================================
   WITHDRAW MODAL
========================================================= */

async function withdrawCapital(
  nominal,
  catatan = "",
  tanggal = ""
) {

  const amount =
    Number(
      nominal
    );


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    throw new Error(
      "Nominal tarik modal harus lebih besar dari 0."
    );

  }


  return await apiRequest(
    "withdrawCapital",
    {

      data: {

        tanggal:
          tanggal ||
          getTodayString(),

        nominal:
          amount,

        catatan:
          String(
            catatan || ""
          ).trim()

      }

    }
  );

}


/* =========================================================
   PING API
========================================================= */

async function pingApi() {

  return await apiRequest(
    "ping"
  );

}


/* =========================================================
   CHECK CONNECTION
========================================================= */

async function checkApiConnection() {

  try {

    const result =
      await pingApi();


    return {

      success:
        true,

      message:
        result.message ||
        "API terhubung."

    };

  } catch (error) {

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
    ).padStart(
      2,
      "0"
    ) +
    "-" +
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    )
  );

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

async function apiGet() {

  return await getAllData();

}


/* =========================================================
   DEBUG
========================================================= */

function debugTradingApi() {

  console.log(
    "===================================="
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
    "===================================="
  );

}


/* =========================================================
   GLOBAL OBJECT
========================================================= */

window.TradingAPI = {

  request:
    apiRequest,

  get:
    apiGet,

  post:
    apiPost,


  ping:
    pingApi,

  check:
    checkApiConnection,


  getAllData:
    getAllData,

  getTransactions:
    getTransactions,

  getModalData:
    getModalData,

  getSummary:
    getSummary,


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


  errorMessage:
    getApiErrorMessage,

  debug:
    debugTradingApi

};


/* =========================================================
   GLOBAL TEST
========================================================= */

window.testTradingAPI =
  checkApiConnection;


window.debugTradingAPI =
  debugTradingApi;


console.log(
  "[TradingAPI] API JS berhasil dimuat."
);
