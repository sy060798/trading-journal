/* =========================================================
   TRADING JOURNAL
   API CONNECTION
   Google Apps Script + Google Sheets
========================================================= */


/* =========================================================
   GOOGLE APPS SCRIPT URL
========================================================= */

const API_URL =
  "https://script.google.com/macros/s/AKfycbypUxWIp8OemScOwiqDeLnnSjpfGb3bVZHw_pzPMIWFSUWiURc6rseuRi5bOZ9LFMGK_A/exec";


/* =========================================================
   BASIC CONFIG
========================================================= */

const API_CONFIG = {
  timeout: 30000
};


/* =========================================================
   REQUEST HELPER
========================================================= */

async function apiRequest(action, data = {}) {

  if (
    !API_URL ||
    API_URL.includes("GANTI_DENGAN")
  ) {
    throw new Error(
      "API_URL belum diisi dengan URL Google Apps Script."
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

    /*
     * Google Apps Script menerima
     * application/x-www-form-urlencoded
     *
     * Contoh:
     *
     * action=getCapital
     *
     * atau:
     *
     * action=addTransaction
     * data={"tanggal":"2026-08-15",...}
     */

    const params =
      new URLSearchParams();


    params.append(
      "action",
      action
    );


    Object.keys(data).forEach(
      function(key) {

        let value =
          data[key];


        /*
         * Object / Array
         * otomatis diubah menjadi JSON.
         */

        if (
          typeof value === "object" &&
          value !== null
        ) {

          value =
            JSON.stringify(value);

        }


        params.append(
          key,
          value ?? ""
        );

      }
    );


    const response =
      await fetch(
        API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded;charset=UTF-8"
          },

          body:
            params.toString(),

          signal:
            controller.signal
        }
      );


    /*
     * Cek HTTP status
     */

    if (!response.ok) {

      throw new Error(
        `HTTP Error ${response.status}`
      );

    }


    /*
     * Ambil response sebagai text
     * terlebih dahulu.
     */

    const text =
      await response.text();


    /*
     * Pastikan response tidak kosong.
     */

    if (!text) {

      throw new Error(
        "Google Apps Script mengembalikan response kosong."
      );

    }


    /*
     * Parse JSON
     */

    let result;


    try {

      result =
        JSON.parse(text);

    } catch (error) {

      console.error(
        "Response Google Apps Script:",
        text
      );


      throw new Error(
        "Response Google Apps Script bukan JSON yang valid."
      );

    }


    /*
     * Response error dari Code.gs
     *
     * {
     *   success: false,
     *   message: "..."
     * }
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
     * Response sukses
     */

    return result;


  } catch (error) {

    /*
     * Timeout
     */

    if (
      error &&
      error.name === "AbortError"
    ) {

      throw new Error(
        "Request timeout. Periksa koneksi atau Google Apps Script."
      );

    }


    /*
     * Error fetch / network
     */

    if (
      error &&
      error instanceof TypeError
    ) {

      throw new Error(
        "Tidak dapat terhubung ke Google Apps Script. Periksa URL Web App, deployment, dan akses Web App."
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
   GET ALL TRANSACTIONS
========================================================= */

async function getTransactions() {

  const result =
    await apiRequest(
      "getTransactions"
    );


  /*
   * Code.gs:
   *
   * {
   *   success: true,
   *   data: [...]
   * }
   */

  if (
    Array.isArray(
      result?.data
    )
  ) {

    return result.data;

  }


  /*
   * Fallback
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
   * Normalisasi data transaksi
   */

  const data = {

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

    /*
     * Bisa menggunakan:
     *
     * profitRugi
     *
     * atau:
     *
     * hasil
     */

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


  const result =
    await apiRequest(
      "addTransaction",
      {
        data: data
      }
    );


  return result;

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


  /*
   * Saat ini Code.gs belum mengaktifkan
   * deleteTransaction.
   *
   * Fungsi ini tetap disediakan agar
   * frontend tidak error jika dipanggil.
   */

  return await apiRequest(
    "deleteTransaction",
    {
      id: id
    }
  );

}


/* =========================================================
   GET CAPITAL
========================================================= */

async function getCapital() {

  const result =
    await apiRequest(
      "getCapital"
    );


  if (
    result &&
    result.data
  ) {

    return result.data;

  }


  if (
    result &&
    result.capital
  ) {

    return result.capital;

  }


  return {};

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


  const result =
    await apiRequest(
      "addCapital",
      {
        amount:
          amount,

        note:
          note || ""
      }
    );


  return result;

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


  const result =
    await apiRequest(
      "withdrawCapital",
      {
        amount:
          amount,

        note:
          note || ""
      }
    );


  return result;

}


/* =========================================================
   GET REPORT
========================================================= */

async function getReport() {

  const result =
    await apiRequest(
      "getReport"
    );


  if (
    result &&
    result.data
  ) {

    return result.data;

  }


  if (
    result &&
    result.report
  ) {

    return result.report;

  }


  return {};

}


/* =========================================================
   GENERIC API REQUEST
========================================================= */

async function apiGet(
  action,
  data = {}
) {

  return await apiRequest(
    action,
    data
  );

}


/* =========================================================
   CONNECTION TEST
========================================================= */

async function testApiConnection() {

  try {

    const result =
      await apiRequest(
        "ping"
      );


    console.log(
      "================================="
    );

    console.log(
      "TRADING JOURNAL API"
    );

    console.log(
      "Connection: OK"
    );

    console.log(
      "Response:",
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
      "Connection: FAILED"
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
   GLOBAL API OBJECT
========================================================= */

window.TradingAPI = {

  /*
   * Request
   */

  request:
    apiRequest,


  /*
   * Transactions
   */

  getTransactions:
    getTransactions,

  addTransaction:
    addTransaction,

  deleteTransaction:
    deleteTransaction,


  /*
   * Capital
   */

  getCapital:
    getCapital,

  addCapital:
    addCapital,

  withdrawCapital:
    withdrawCapital,


  /*
   * Report
   */

  getReport:
    getReport,


  /*
   * Testing
   */

  test:
    testApiConnection,


  /*
   * Error helper
   */

  errorMessage:
    getApiErrorMessage

};


/* =========================================================
   OPTIONAL GLOBAL SHORTCUT
========================================================= */

window.testTradingAPI =
  testApiConnection;
