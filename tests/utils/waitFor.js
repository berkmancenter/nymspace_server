const waitFor = async (callback, timeout = 5000) => {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    try {
      await callback()
      return // Condition met
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 50)) // Wait a bit
    }
  }

  throw new Error('Timeout exceeded')
}

module.exports = waitFor
