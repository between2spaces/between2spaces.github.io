local M = {
  "akinsho/bufferline.nvim",
  lazy = false,
  dependencies = "nvim-tree/nvim-web-devicons",
}

function M.config()
  require("bufferline").setup {}
end

return M
