return {
	"nvim-telescope/telescope.nvim",
	dependencies = "nvim-lua/plenary.nvim",
	keys = {
		{ "<leader><space>", "<cmd>Telescope find_files<cr>", desc = "Find Files" },
		{ "<leader>/", "<cmd>Telescope live_grep<cr>", desc = "Find in Files (Grep)" },
		{ "<leader><tab>", "<cmd>Telescope buffers<cr>", desc = "Find Buffers" },
		{ "<leader>h", "<cmd>Telescope help_tags<cr>", desc = "Find Help" },
	},
	opts = {
		pickers = {
			find_files = { hidden = true }
		}
	}
}
