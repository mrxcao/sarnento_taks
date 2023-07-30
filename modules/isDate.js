module.exports = a => {
	return (new Date(a) !== "Invalid Date") && !isNaN(new Date(a));
};