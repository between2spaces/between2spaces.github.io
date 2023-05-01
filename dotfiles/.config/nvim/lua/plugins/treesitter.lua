return {
  "nvim-treesitter/nvim-treesitter",
  event = "BufReadPost",
  config = function ()
	  local treesitter = require "nvim-treesitter"
	  local configs = require "nvim-treesitter.configs"

	  configs.setup {
		ensure_installed = { "lua", "markdown", "bash", "python", "javascript", "html", "css" },
		sync_install = false,
		highlight = { enable = true, },
		autopairs = { enable = true, },
		indent = { enable = true, disable = { "python", "css" } },

		context_commentstring = {
		  enable = true,
		  enable_autocmd = false,
		},
	  }
	end
}
