document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const token = localStorage.getItem("token")

  if (!currentUser || !token) {
    // Redirect to login if not logged in
    window.location.href = "index.html"
    return
  }

  // Get token from URL parameters
  const urlParams = new URLSearchParams(window.location.search)
  const tokenType = urlParams.get("token") || "TRX"

  // Update UI with token name
  const tokenTitle = document.getElementById("tokenTitle")
  const tokenTypeSelect = document.getElementById("tokenType")
  const fundTokenTypeSelect = document.getElementById("fundTokenType")

  if (tokenTitle) {
    tokenTitle.textContent = "Funds"
  }

  if (tokenTypeSelect && tokenType) {
    tokenTypeSelect.value = tokenType
  }

  if (fundTokenTypeSelect && tokenType) {
    fundTokenTypeSelect.value = tokenType
  }

  // Handle send options
  const sendOptions = document.querySelectorAll(".send-option")
  const sendForms = document.querySelectorAll(".send-form")

  sendOptions.forEach((option) => {
    option.addEventListener("click", function () {
      // Remove active class from all options and forms
      sendOptions.forEach((opt) => opt.classList.remove("active"))
      sendForms.forEach((form) => form.classList.remove("active"))

      // Add active class to clicked option
      this.classList.add("active")

      // Show corresponding form
      const formId = this.getAttribute("data-form")
      document.getElementById(formId).classList.add("active")
    })
  })

  // Set the first option as active by default
  if (sendOptions.length > 0 && !document.querySelector(".send-option.active")) {
    sendOptions[0].classList.add("active")
    const defaultFormId = sendOptions[0].getAttribute("data-form")
    document.getElementById(defaultFormId).classList.add("active")
  }

  // Main Wallet Form
  const mainWalletForm = document.getElementById("mainWalletForm")
  if (mainWalletForm) {
    mainWalletForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const recipientAddress = document.getElementById("mainRecipientAddress").value
      const amount = document.getElementById("mainAmount").value
      const note = document.getElementById("mainNote").value
      const errorElement = document.getElementById("mainSendError")

      // Clear previous errors
      errorElement.textContent = ""

      // Validate amount
      if (Number.parseFloat(amount) <= 0) {
        errorElement.textContent = "Amount must be greater than 0"
        return
      }

      // Make API request to send funds from main wallet
      fetch("/api/transactions/send-main", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientAddress,
          amount: Number.parseFloat(amount),
          note,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Show receipt
            showReceipt({
              type: "sent",
              amount: Number.parseFloat(amount),
              token: "MAIN",
              recipient: recipientAddress,
              date: new Date().toISOString(),
              txId: data.transactionId || generateTxId(),
              note,
            })
          } else {
            errorElement.textContent = data.message || "Failed to send funds"
          }
        })
        .catch((error) => {
          errorElement.textContent = "An error occurred. Please try again."
          console.error("Send funds error:", error)
        })
    })
  }

  // Token Form
  const tokenForm = document.getElementById("tokenForm")
  if (tokenForm) {
    tokenForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const tokenType = document.getElementById("tokenType").value
      const recipientAddress = document.getElementById("recipientAddress").value
      const amount = document.getElementById("tokenAmount").value
      const note = document.getElementById("tokenNote").value
      const errorElement = document.getElementById("sendTokenError")

      // Clear previous errors
      errorElement.textContent = ""

      // Validate amount
      if (Number.parseFloat(amount) <= 0) {
        errorElement.textContent = "Amount must be greater than 0"
        return
      }

      // Make API request to send token
      fetch("/api/transactions/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientAddress,
          amount: Number.parseFloat(amount),
          tokenType,
          note,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Show receipt
            showReceipt({
              type: "sent",
              amount: Number.parseFloat(amount),
              token: tokenType,
              recipient: recipientAddress,
              date: new Date().toISOString(),
              txId: data.transactionId || generateTxId(),
              note,
            })
          } else {
            errorElement.textContent = data.message || "Failed to send funds"
          }
        })
        .catch((error) => {
          errorElement.textContent = "An error occurred. Please try again."
          console.error("Send funds error:", error)
        })
    })
  }

  // Fund Token from Main Form
  const fundTokenForm = document.getElementById("fundTokenForm")
  if (fundTokenForm) {
    fundTokenForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const tokenType = document.getElementById("fundTokenType").value
      const amount = document.getElementById("fundAmount").value
      const note = document.getElementById("fundNote").value
      const errorElement = document.getElementById("fundTokenError")

      // Clear previous errors
      errorElement.textContent = ""

      // Validate amount
      if (Number.parseFloat(amount) <= 0) {
        errorElement.textContent = "Amount must be greater than 0"
        return
      }

      // Make API request to fund token wallet from main wallet
      fetch("/api/transactions/fund-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tokenType,
          amount: Number.parseFloat(amount),
          note: note || `Funded ${tokenType} wallet from main wallet`,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Show receipt
            showReceipt({
              type: "main-to-token",
              amount: Number.parseFloat(amount),
              token: tokenType,
              recipient: currentUser[`${tokenType.toLowerCase()}WalletAddress`] || "Your Token Wallet",
              date: new Date().toISOString(),
              txId: data.transactionId || generateTxId(),
              note: note || `Funded ${tokenType} wallet from main wallet`,
            })
          } else {
            errorElement.textContent = data.message || "Failed to fund token wallet"
          }
        })
        .catch((error) => {
          errorElement.textContent = "An error occurred. Please try again."
          console.error("Fund token error:", error)
        })
    })
  }

  // Close modals
  const closeModalButtons = document.querySelectorAll(".close-modal")
  closeModalButtons.forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".modal").forEach((modal) => {
        modal.classList.remove("active")
      })
    })
  })

  // Helper functions
  function generateTxId() {
    return "tx_" + Math.random().toString(36).substring(2, 15)
  }

  function showReceipt(transaction) {
    const receiptModal = document.getElementById("receiptModal")
    const receiptContent = document.getElementById("receiptContent")

    if (!receiptModal || !receiptContent) return

    const date = new Date(transaction.date)
    const formattedDate = date.toLocaleDateString() + " " + date.toLocaleTimeString()

    const title = "Transaction Receipt"
    let subtitle = ""

    if (transaction.type === "sent") {
      subtitle = `Sent ${transaction.token}`
    } else if (transaction.type === "main-to-token") {
      subtitle = `Funded ${transaction.token} from Main Wallet`
    }

    receiptContent.innerHTML = `
      <div class="receipt-header">
        <div class="receipt-logo"><i class="fas fa-receipt"></i></div>
        <div class="receipt-title">${title}</div>
        <div class="receipt-subtitle">${subtitle}</div>
      </div>
      
      <div class="receipt-amount">
        <div class="receipt-amount-value">${transaction.amount.toFixed(2)} ${transaction.token}</div>
      </div>
      
      <div class="receipt-details">
        <div class="receipt-row">
          <div class="receipt-label">Date</div>
          <div class="receipt-value">${formattedDate}</div>
        </div>
        <div class="receipt-row">
          <div class="receipt-label">From</div>
          <div class="receipt-value">${transaction.type === "main-to-token" ? "Main Wallet" : currentUser.name}</div>
        </div>
        <div class="receipt-row">
          <div class="receipt-label">To</div>
          <div class="receipt-value">${transaction.recipient}</div>
        </div>
        <div class="receipt-row">
          <div class="receipt-label">Token</div>
          <div class="receipt-value">${transaction.token}</div>
        </div>
        ${
          transaction.note
            ? `
        <div class="receipt-row">
          <div class="receipt-label">Note</div>
          <div class="receipt-value">${transaction.note}</div>
        </div>
        `
            : ""
        }
        <div class="receipt-row">
          <div class="receipt-label">Transaction ID</div>
          <div class="receipt-value">${transaction.txId}</div>
        </div>
        <div class="receipt-row">
          <div class="receipt-label">Status</div>
          <div class="receipt-value">Completed</div>
        </div>
      </div>
      
      <div class="receipt-footer">
        <p>Thank you for using our service</p>
      </div>
    `

    receiptModal.classList.add("active")

    // Print receipt functionality
    const printReceiptBtn = document.getElementById("printReceiptBtn")
    if (printReceiptBtn) {
      printReceiptBtn.addEventListener("click", () => {
        const printWindow = window.open("", "", "width=600,height=600")
        printWindow.document.write("<html><head><title>Transaction Receipt</title>")
        printWindow.document.write(
          "<style>body { font-family: Arial, sans-serif; padding: 20px; } .receipt { padding: 20px; border: 1px solid #ddd; } .receipt-header { text-align: center; margin-bottom: 20px; } .receipt-title { font-size: 18px; font-weight: bold; } .receipt-amount { text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; } .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; } .receipt-footer { text-align: center; margin-top: 20px; color: #666; }</style>",
        )
        printWindow.document.write("</head><body>")
        printWindow.document.write(receiptContent.innerHTML)
        printWindow.document.write("</body></html>")
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 250)
      })
    }
  }
})

