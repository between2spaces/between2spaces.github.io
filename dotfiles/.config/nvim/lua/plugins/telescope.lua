return {
	"nvim-telescope/telescope.nvim",
	dependencies = { 'nvim-lua/plenary.nvim' },
	event = "Bufenter",
	config = function()
		local status_ok, telescope = pcall(require, "telescope")
		if not status_ok then
			return
		end
		local actions = require("telescope.actions")
		telescope.setup {
			defaults = {
				mappings = {
					i = {
						["<esc>"] = actions.close,
					},
				},
			},
		}
	end
}
