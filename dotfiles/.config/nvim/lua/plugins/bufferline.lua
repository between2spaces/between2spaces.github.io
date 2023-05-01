return {
	"akinsho/bufferline.nvim",
	lazy = false,
	dependencies = "nvim-tree/nvim-web-devicons",
	config = function ()
		require("bufferline").setup {}
	end
}
