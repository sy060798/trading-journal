/* =========================================================
   TRADING JOURNAL
   API CONNECTION
   Google Apps Script + Google Sheets

   COMPATIBLE DENGAN Code.gs:
   - GET  -> mengambil semua data
   - POST transaction
   - POST add_modal
   - POST withdraw_modal
========================================================= */


/* =========================================================
   GOOGLE APPS SCRIPT URL
========================================================= */

const API_URL =
  "https://script.google.com/macros/s/AKfycbypUxWIp8OemScOwiqDeLnnSjpfGb3bVZHw_pzPMIWFSUWiURc6rseuRi5bOZ9LFMGK_A/exec";


/* =========================================================
   CONFIG
========================================================= */

const API_CONFIG = {
  timeout: 30000
};


/* =========================================================
   REQUEST JSON
========================================================= */

async function apiPost(action, data = {}) {

  if (!API_URL) {
    throw new Error(
      "API_URL belum diisi."
    );
  }


  if (!action) {
    throw new Error(
      "Action API tidak boleh kosong."
    );
  }


  const controller =
    new AbortController();


  const timeout =
    setTimeout(
      () => controller.abort(),
      API_CONFIG.timeout
    );


  try {

    const payload = {
      action: action,
      ...data
    };


    console.log(
      "[API POST]",
      payload
    );


    const response =
      await fetch(
        API_URL,
        {
          method: "POST",

          /*
           * text/plain sengaja digunakan
           * supaya browser tidak melakukan
           * preflight OPTIONS.
           */

          headers: {
            "Content-Type":
              "text/plain;charset=utf-8"
          },

          body:
            JSON.stringify(payload),

          redirect:
            "follow",

          signal:
            controller.signal
        }
      );


    if (!response.ok) {

      throw new Error(
        `HTTP Error ${response.status}`
      );

    }


    const text =
      await response.text();


    console.log(
      "[API RESPONSE]",
      text
    );


    if (!text) {

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
        "Response bukan JSON:",
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
        "Request timeout. Periksa koneksi Google Apps Script."
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

  if (!API_URL) {

    throw new Error(
      "API_URL belum diisi."
    );

  }


  const controller =
    new AbortController();


  const timeout =
    setTimeout(
      () => controller.abort(),
      API_CONFIG.timeout
    );


  try {

    console.log(
      "[API GET]",
      API_URL
    );


    const response =
      await fetch(
        API_URL,
        {
          method: "GET",

          redirect:
            "follow",

          signal:
            controller.signal
        }
      );


    if (!response.ok) {

      throw new Error(
        `HTTP Error ${response.status}`
      );

    }


    const text =
      await response.text();


    console.log(
      "[API GET RESPONSE]",
      text
    );


    if (!text) {

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
        "GET response bukan JSON:",
        text
      );


      throw new Error(
        "Response GET Google Apps Script bukan JSON yang valid."
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
        "Request timeout. Periksa koneksi Google Apps Script."
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
    result?.data || {};


  return (
    Array.isArray(
      data.transaksi
    )
      ? data.transaksi
      : []
  );

}


/* =========================================================
   GET CAPITAL / SUMMARY
========================================================= */

async function getCapital() {

  const result =
    await getAllData();


  return (
    result?.data?.summary ||
    {}
  );

}


/* =========================================================
   GET REPORT
========================================================= */

async function getReport() {

  const result =
    await getAllData();


  return (
    result?.data ||
    {}
  );

}


/* =========================================================
   ADD TRANSACTION
========================================================= */

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
   * Sesuai dengan Code.gs:
   *
   * case 'transaction':
   *     result = addTransaction(body);
   *
   * Jadi data transaksi dikirim langsung
   * ke body JSON.
   */

  const payload = {

    tanggal:
      transaction.tanggal ||
      "",

    saham:
      transaction.saham ||
      "",

    aksi:
      transaction.aksi ||
      "",

    harga:
      transaction.harga ||
      0,

    lot:
      transaction.lot ||
      0,

    profitRugi:
      transaction.profitRugi ||
      transaction.hasil ||
      "",

    nominal:
      transaction.nominal ||
      0,

    catatan:
      transaction.catatan ||
      ""

  };


  return await apiPost(
    "transaction",
    payload
  );

}


/* =========================================================
   DELETE TRANSACTION
========================================================= */

async function deleteTransaction(
  id
) {

  /*
   * Code.gs saat ini BELUM mempunyai
   * action deleteTransaction.
   *
   * Jadi jangan panggil endpoint ini
   * sebelum fitur delete ditambahkan
   * ke Code.gs.
   */

  throw new Error(
    "Fitur hapus transaksi belum diaktifkan di Google Apps Script."
  );

}


/* =========================================================
   ADD CAPITAL
========================================================= */

async function addCapital(
  amount,
  note = ""
) {

  amount =
    Number(amount);


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    throw new Error(
      "Nominal tambah modal tidak valid."
    );

  }


  /*
   * Code.gs:
   *
   * case 'add_modal':
   *     result = addModal(body);
   */

  return await apiPost(
    "add_modal",
    {
      tanggal:
        getTodayDate(),

      nominal:
        amount,

      catatan:
        note || ""
    }
  );

}


/* =========================================================
   WITHDRAW CAPITAL
========================================================= */

async function withdrawCapital(
  amount,
  note = ""
) {

  amount =
    Number(amount);


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    throw new Error(
      "Nominal penarikan tidak valid."
    );

  }


  /*
   * Code.gs:
   *
   * case 'withdraw_modal':
   *     result = withdrawModal(body);
   */

  return await apiPost(
    "withdraw_modal",
    {
      tanggal:
        getTodayDate(),

      nominal:
        amount,

      catatan:
        note || ""
    }
  );

}


/* =========================================================
   TODAY
========================================================= */

function getTodayDate() {

  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );


  return (
    `${year}-${month}-${day}`
  );

}


/* =========================================================
   GENERIC REQUEST
========================================================= */

async function apiRequest(
  action,
  data = {}
) {

  /*
   * Untuk action GET data,
   * gunakan getAllData().
   */

  if (
    action === "getTransactions" ||
    action === "getCapital" ||
    action === "getReport"
  ) {

    return await getAllData();

  }


  /*
   * Untuk POST.
   */

  return await apiPost(
    action,
    data
  );

}


/* =========================================================
   TEST CONNECTION
========================================================= */

async function testApiConnection() {

  try {

    const result =
      await getAllData();


    console.log(
      "================================="
    );

    console.log(
      "TRADING JOURNAL API"
    );

    console.log(
      "CONNECTION: OK"
    );

    console.log(
      "RESPONSE:",
      result
    );

    console.log(
      "================================="
    );


    return true;


  } catch (error) {

    console.error(
      "================================="
    );

    console.error(
      "TRADING JOURNAL API"
    );

    console.error(
      "CONNECTION: FAILED"
    );

    console.error(
      error
    );

    console.error(
      "================================="
    );


    return false;

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
   GLOBAL API OBJECT
========================================================= */

window.TradingAPI = {

  request:
    apiRequest,

  getAllData:
    getAllData,

  getTransactions:
    getTransactions,

  addTransaction:
    addTransaction,

  deleteTransaction:
    deleteTransaction,

  getCapital:
    getCapital,

  addCapital:
    addCapital,

  withdrawCapital:
    withdrawCapital,

  getReport:
    getReport,

  test:
    testApiConnection,

  errorMessage:
    getApiErrorMessage

};


/* =========================================================
   GLOBAL TEST
========================================================= */

window.testTradingAPI =
  testApiConnection;
