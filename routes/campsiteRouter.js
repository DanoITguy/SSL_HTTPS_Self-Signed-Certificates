const express = require('express');
const Campsite = require('../models/campsite');
const authenticate = require('../authenticate');

const campsiteRouter = express.Router();

campsiteRouter.route('/')
.get((req, res, next) => {
    Campsite.find()
    .populate('comments.author')
    .then(campsites => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(campsites);
    })
    .catch(err => next(err));
})
.post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.create(req.body)
    .then(campsite => {
        console.log('Campsite Created ', campsite);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(campsite);
    })
    .catch(err => next(err));
})
.put(authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /campsites');
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.deleteMany()
    .then(response => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response);
    })
    .catch(err => next(err));
});

campsiteRouter.route('/:campsiteId')
.get((req, res, next) => {
    Campsite.findById(req.params.campsiteId)
    .populate('comments.author')
    .then(campsite => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(campsite);
    })
    .catch(err => next(err));
})
.post(authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(`POST operation not supported on /campsites/${req.params.campsiteId}`);
})
.put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.findByIdAndUpdate(req.params.campsiteId, {
        $set: req.body
    }, { new: true })
    .then(campsite => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(campsite);
    })
    .catch(err => next(err));
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.findByIdAndDelete(req.params.campsiteId)
    .then(response => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response);
    })
    .catch(err => next(err));
});

campsiteRouter.route('/:campsiteId/comments')
.get((req, res, next) => {
    Campsite.findById(req.params.campsiteId)
    .populate('comments.author')
    .then(campsite => {
        if (campsite) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(campsite.comments);
        } else {
            err = new Error(`Campsite ${req.params.campsiteId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
    .then(campsite => {
        if (campsite) {
            req.body.author = req.user._id;
            campsite.comments.push(req.body);
            campsite.save()
            .then(campsite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(campsite);
            })
            .catch(err => next(err));
        } else {
            err = new Error(`Campsite ${req.params.campsiteId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
})
.put(authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(`PUT operation not supported on /campsites/${req.params.campsiteId}/comments`);
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
    .then(campsite => {
        if (campsite) {
            for (let i = (campsite.comments.length-1); i >= 0; i--) {
                            
                //campsite.comments.id(campsite.comments[i]._id).remove();

                campsite.comments.id(campsite.comments[i]._id).deleteOne(); // Changed from .remove()
            }
            campsite.save()
            .then(campsite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(campsite);
            })
            .catch(err => next(err));
        } else {
            err = new Error(`Campsite ${req.params.campsiteId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
});

// campsiteRouter.route('/:campsiteId/comments/:commentId')
// .get((req, res, next) => {
//     Campsite.findById(req.params.campsiteId)
//     .populate('comments.author')
//     .then(campsite => {
//         if (campsite && campsite.comments.id(req.params.commentId)) {
//             res.statusCode = 200;
//             res.setHeader('Content-Type', 'application/json');
//             res.json(campsite.comments.id(req.params.commentId));
//         } else if (!campsite) {
//             err = new Error(`Campsite ${req.params.campsiteId} not found`);
//             err.status = 404;
//             return next(err);
//         } else {
//             err = new Error(`Comment ${req.params.commentId} not found`);
//             err.status = 404;
//             return next(err);
//         }
//     })
//     .catch(err => next(err));
// })
// .post(authenticate.verifyUser, (req, res) => {
//     res.statusCode = 403;
//     res.end(`POST operation not supported on /campsites/${req.params.campsiteId}/comments/${req.params.commentId}`);
// })
// .put(authenticate.verifyUser, (req, res, next) => {
//     Campsite.findById(req.params.campsiteId)
//     .then(campsite => {
//         if (campsite && campsite.comments.id(req.params.commentId)) {
//             if((campsite.comments.id(req.params.commentId).author._id).equals(req.user._id)) {
//                 if (req.body.rating) {
//                     campsite.comments.id(req.params.commentId).rating = req.body.rating;
//                 }
//                 if (req.body.text) {
//                     campsite.comments.id(req.params.commentId).text = req.body.text;
//                 }
//                 campsite.save()
//                 .then(campsite => {
//                     res.statusCode = 200;
//                     res.setHeader('Content-Type', 'application/json');
//                     res.json(campsite);
//                 })
//                 .catch(err => next(err));
//             }
//         } else if (!campsite) {
//             err = new Error(`Campsite ${req.params.campsiteId} not found`);
//             err.status = 404;
//             return next(err);
//         } else {
//             err = new Error(`Comment ${req.params.commentId} not found`);
//             err.status = 404;
//             return next(err);
//         }
//     })
//     .catch(err => next(err));
// })
// .delete(authenticate.verifyUser, (req, res, next) => {
//     Campsite.findById(req.params.campsiteId)
//     .then(campsite => {
//         if (campsite && campsite.comments.id(req.params.commentId)) {
//             if((campsite.comments.id(req.params.commentId).author._id).equals(req.user._id)) {
//                 campsite.comments.id(req.params.commentId).remove();
//                 campsite.save()
//                 .then(campsite => {
//                     res.statusCode = 200;
//                     res.setHeader('Content-Type', 'application/json');
//                     res.json(campsite);
//                 })
//                 .catch(err => next(err));
//             }
//         } else if (!campsite) {
//             err = new Error(`Campsite ${req.params.campsiteId} not found`);
//             err.status = 404;
//             return next(err);
//         } else {
//             err = new Error(`Comment ${req.params.commentId} not found`);
//             err.status = 404;
//             return next(err);
//         }
//     })
//     .catch(err => next(err));
// });


campsiteRouter.route('/:campsiteId/comments/:commentId')
.get((req, res, next) => {
    Campsite.findById(req.params.campsiteId)
    .populate('comments.author')
    .then(campsite => {
        if (campsite && campsite.comments.id(req.params.commentId)) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(campsite.comments.id(req.params.commentId));
        } else if (!campsite) {
            const err = new Error(`Campsite ${req.params.campsiteId} not found`);
            err.status = 404;
            return next(err);
        } else {
            const err = new Error(`Comment ${req.params.commentId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
})
.post(authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(`POST operation not supported on /campsites/${req.params.campsiteId}/comments/${req.params.commentId}`);
})
.put(authenticate.verifyUser, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
    .then(campsite => {
        if (campsite && campsite.comments.id(req.params.commentId)) {
            if((campsite.comments.id(req.params.commentId).author._id).equals(req.user._id)) {
                if (req.body.rating) {
                    campsite.comments.id(req.params.commentId).rating = req.body.rating;
                }
                if (req.body.text) {
                    campsite.comments.id(req.params.commentId).text = req.body.text;
                }
                campsite.save()
                .then(campsite => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(campsite);
                })
                .catch(err => next(err));
            } else {
                // ADD THIS: Handle when user is not the author
                const err = new Error('You are not authorized to update this comment!');
                err.status = 403;
                return next(err);
            }
        } else if (!campsite) {
            const err = new Error(`Campsite ${req.params.campsiteId} not found`);
            err.status = 404;
            return next(err);
        } else {
            const err = new Error(`Comment ${req.params.commentId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
})
.delete(authenticate.verifyUser, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
    .then(campsite => {
        if (campsite && campsite.comments.id(req.params.commentId)) {
            if((campsite.comments.id(req.params.commentId).author._id).equals(req.user._id)) {
                campsite.comments.id(req.params.commentId).deleteOne(); // Changed from .remove()
                campsite.save()
                .then(campsite => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(campsite);
                })
                .catch(err => next(err));
            } else {
                // ADD THIS: Handle when user is not the author
                const err = new Error('You are not authorized to delete this comment!');
                err.status = 403;
                return next(err);
            }
        } else if (!campsite) {
            const err = new Error(`Campsite ${req.params.campsiteId} not found`);
            err.status = 404;
            return next(err);
        } else {
            const err = new Error(`Comment ${req.params.commentId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
});





module.exports = campsiteRouter;



// const express = require('express');
// const Campsite = require('../models/campsite');
// const authenticate = require('../authenticate');

// const campsiteRouter = express.Router();

// campsiteRouter.route('/')
// .get((req, res, next) => {
//     Campsite.find()
//     .populate('comments.author')
//     .then(campsites => {
//         res.statusCode = 200;
//         res.setHeader('Content-Type', 'application/json');
//         res.json(campsites);
//     })
//     .catch(err => next(err));
// })
// .post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
//     Campsite.create(req.body)
//     .then(campsite => {
//         console.log('Campsite Created ', campsite);
//         res.statusCode = 200;
//         res.setHeader('Content-Type', 'application/json');
//         res.json(campsite);
//     })
//     .catch(err => next(err));
// })
// .put(authenticate.verifyUser, (req, res) => {
//     res.statusCode = 403;
//     res.end('PUT operation not supported on /campsites');
// })
// .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
//     Campsite.deleteMany()
//     .then(response => {
//         res.statusCode = 200;
//         res.setHeader('Content-Type', 'application/json');
//         res.json(response);
//     })
//     .catch(err => next(err));
// });

// campsiteRouter.route('/:campsiteId')
// .get((req, res, next) => {
//     Campsite.findById(req.params.campsiteId)
//     .populate('comments.author')
//     .then(campsite => {
//         res.statusCode = 200;
//         res.setHeader('Content-Type', 'application/json');
//         res.json(campsite);
//     })
//     .catch(err => next(err));
// })
// .post(authenticate.verifyUser, (req, res) => {
//     res.statusCode = 403;
//     res.end(`POST operation not supported on /campsites/${req.params.campsiteId}`);
// })
// .put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
//     Campsite.findByIdAndUpdate(req.params.campsiteId, {
//         $set: req.body
//     }, { new: true })
//     .then(campsite => {
//         res.statusCode = 200;
//         res.setHeader('Content-Type', 'application/json');
//         res.json(campsite);
//     })
//     .catch(err => next(err));
// })
// .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
//     Campsite.findByIdAndDelete(req.params.campsiteId)
//     .then(response => {
//         res.statusCode = 200;
//         res.setHeader('Content-Type', 'application/json');
//         res.json(response);
//     })
//     .catch(err => next(err));
// });

// campsiteRouter.route('/:campsiteId/comments')
// .get((req, res, next) => {
//     Campsite.findById(req.params.campsiteId)
//     .populate('comments.author')
//     .then(campsite => {
//         if (campsite) {
//             res.statusCode = 200;
//             res.setHeader('Content-Type', 'application/json');
//             res.json(campsite.comments);
//         } else {
//             err = new Error(`Campsite ${req.params.campsiteId} not found`);
//             err.status = 404;
//             return next(err);
//         }
//     })
//     .catch(err => next(err));
// })
// .post(authenticate.verifyUser, (req, res, next) => {
//     Campsite.findById(req.params.campsiteId)
//     .then(campsite => {
//         if (campsite) {
//             req.body.author = req.user._id;
//             campsite.comments.push(req.body);
//             campsite.save()
//             .then(campsite => {
//                 res.statusCode = 200;
//                 res.setHeader('Content-Type', 'application/json');
//                 res.json(campsite);
//             })
//             .catch(err => next(err));
//         } else {
//             err = new Error(`Campsite ${req.params.campsiteId} not found`);
//             err.status = 404;
//             return next(err);
//         }
//     })
//     .catch(err => next(err));
// })
// .put(authenticate.verifyUser, (req, res) => {
//     res.statusCode = 403;
//     res.end(`PUT operation not supported on /campsites/${req.params.campsiteId}/comments`);
// })
// .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
//     Campsite.findById(req.params.campsiteId)
//     .then(campsite => {
//         if (campsite) {
//             for (let i = (campsite.comments.length-1); i >= 0; i--) {
//                 campsite.comments.id(campsite.comments[i]._id).remove();
//             }
//             campsite.save()
//             .then(campsite => {
//                 res.statusCode = 200;
//                 res.setHeader('Content-Type', 'application/json');
//                 res.json(campsite);
//             })
//             .catch(err => next(err));
//         } else {
//             err = new Error(`Campsite ${req.params.campsiteId} not found`);
//             err.status = 404;
//             return next(err);
//         }
//     })
//     .catch(err => next(err));
// });

// campsiteRouter.route('/:campsiteId/comments/:commentId')
// .get((req, res, next) => {
//     Campsite.findById(req.params.campsiteId)
//     .populate('comments.author')
//     .then(campsite => {
//         if (campsite && campsite.comments.id(req.params.commentId)) {
//             res.statusCode = 200;
//             res.setHeader('Content-Type', 'application/json');
//             res.json(campsite.comments.id(req.params.commentId));
//         } else if (!campsite) {
//             err = new Error(`Campsite ${req.params.campsiteId} not found`);
//             err.status = 404;
//             return next(err);
//         } else {
//             err = new Error(`Comment ${req.params.commentId} not found`);
//             err.status = 404;
//             return next(err);
//         }
//     })
//     .catch(err => next(err));
// })
// .post(authenticate.verifyUser, (req, res) => {
//     res.statusCode = 403;
//     res.end(`POST operation not supported on /campsites/${req.params.campsiteId}/comments/${req.params.commentId}`);
// })
// .put(authenticate.verifyUser, (req, res, next) => {
//     Campsite.findById(req.params.campsiteId)
//     .then(campsite => {
//         if (campsite && campsite.comments.id(req.params.commentId)) {
//             if((campsite.comments.id(req.params.commentId).author._id).equals(req.user._id)) {
//                 if (req.body.rating) {
//                     campsite.comments.id(req.params.commentId).rating = req.body.rating;
//                 }
//                 if (req.body.text) {
//                     campsite.comments.id(req.params.commentId).text = req.body.text;
//                 }
//                 campsite.save()
//                 .then(campsite => {
//                     res.statusCode = 200;
//                     res.setHeader('Content-Type', 'application/json');
//                     res.json(campsite);
//                 })
//                 .catch(err => next(err));
//             }
//         } else if (!campsite) {
//             err = new Error(`Campsite ${req.params.campsiteId} not found`);
//             err.status = 404;
//             return next(err);
//         } else {
//             err = new Error(`Comment ${req.params.commentId} not found`);
//             err.status = 404;
//             return next(err);
//         }
//     })
//     .catch(err => next(err));
// })
// .delete(authenticate.verifyUser, (req, res, next) => {
//     Campsite.findById(req.params.campsiteId)
//     .then(campsite => {
//         if (campsite && campsite.comments.id(req.params.commentId)) {
//             if((campsite.comments.id(req.params.commentId).author._id).equals(req.user._id)) {
//                 campsite.comments.id(req.params.commentId).remove();
//                 campsite.save()
//                 .then(campsite => {
//                     res.statusCode = 200;
//                     res.setHeader('Content-Type', 'application/json');
//                     res.json(campsite);
//                 })
//                 .catch(err => next(err));
//             }
//         } else if (!campsite) {
//             err = new Error(`Campsite ${req.params.campsiteId} not found`);
//             err.status = 404;
//             return next(err);
//         } else {
//             err = new Error(`Comment ${req.params.commentId} not found`);
//             err.status = 404;
//             return next(err);
//         }
//     })
//     .catch(err => next(err));
// });

// module.exports = campsiteRouter;









// // const express = require('express');
// // const Campsite = require('../models/campsite');
// // const authenticate = require('../authenticate');

// // const campsiteRouter = express.Router();

// // campsiteRouter.route('/')
// // .get((req, res, next) => {
// //     Campsite.find()
// //     .populate('comments.author')
// //     .then(campsites => {
// //         res.statusCode = 200;
// //         res.setHeader('Content-Type', 'application/json');
// //         res.json(campsites);
// //     })
// //     .catch(err => next(err));
// // })
// // .post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
// //     Campsite.create(req.body)
// //     .then(campsite => {
// //         console.log('Campsite Created ', campsite);
// //         res.statusCode = 200;
// //         res.setHeader('Content-Type', 'application/json');
// //         res.json(campsite);
// //     })
// //     .catch(err => next(err));
// // })
// // .put(authenticate.verifyUser, (req, res) => {
// //     res.statusCode = 403;
// //     res.end('PUT operation not supported on /campsites');
// // })
// // .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
// //     Campsite.deleteMany()
// //     .then(response => {
// //         res.statusCode = 200;
// //         res.setHeader('Content-Type', 'application/json');
// //         res.json(response);
// //     })
// //     .catch(err => next(err));
// // });

// // campsiteRouter.route('/:campsiteId')
// // .get((req, res, next) => {
// //     Campsite.findById(req.params.campsiteId)
// //     .populate('comments.author')
// //     .then(campsite => {
// //         res.statusCode = 200;
// //         res.setHeader('Content-Type', 'application/json');
// //         res.json(campsite);
// //     })
// //     .catch(err => next(err));
// // })
// // .post(authenticate.verifyUser, (req, res) => {
// //     res.statusCode = 403;
// //     res.end(`POST operation not supported on /campsites/${req.params.campsiteId}`);
// // })
// // .put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
// //     Campsite.findByIdAndUpdate(req.params.campsiteId, {
// //         $set: req.body
// //     }, { new: true })
// //     .then(campsite => {
// //         res.statusCode = 200;
// //         res.setHeader('Content-Type', 'application/json');
// //         res.json(campsite);
// //     })
// //     .catch(err => next(err));
// // })
// // .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
// //     Campsite.findByIdAndDelete(req.params.campsiteId)
// //     .then(response => {
// //         res.statusCode = 200;
// //         res.setHeader('Content-Type', 'application/json');
// //         res.json(response);
// //     })
// //     .catch(err => next(err));
// // });

// // campsiteRouter.route('/:campsiteId/comments')
// // .get((req, res, next) => {
// //     Campsite.findById(req.params.campsiteId)
// //     .populate('comments.author')
// //     .then(campsite => {
// //         if (campsite) {
// //             res.statusCode = 200;
// //             res.setHeader('Content-Type', 'application/json');
// //             res.json(campsite.comments);
// //         } else {
// //             err = new Error(`Campsite ${req.params.campsiteId} not found`);
// //             err.status = 404;
// //             return next(err);
// //         }
// //     })
// //     .catch(err => next(err));
// // })
// // .post(authenticate.verifyUser, (req, res, next) => {
// //     Campsite.findById(req.params.campsiteId)
// //     .then(campsite => {
// //         if (campsite) {
// //             req.body.author = req.user._id;
// //             campsite.comments.push(req.body);
// //             campsite.save()
// //             .then(campsite => {
// //                 res.statusCode = 200;
// //                 res.setHeader('Content-Type', 'application/json');
// //                 res.json(campsite);
// //             })
// //             .catch(err => next(err));
// //         } else {
// //             err = new Error(`Campsite ${req.params.campsiteId} not found`);
// //             err.status = 404;
// //             return next(err);
// //         }
// //     })
// //     .catch(err => next(err));
// // })
// // .put(authenticate.verifyUser, (req, res) => {
// //     res.statusCode = 403;
// //     res.end(`PUT operation not supported on /campsites/${req.params.campsiteId}/comments`);
// // })
// // .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
// //     Campsite.findById(req.params.campsiteId)
// //     .then(campsite => {
// //         if (campsite) {
// //             for (let i = (campsite.comments.length-1); i >= 0; i--) {
// //                 campsite.comments.id(campsite.comments[i]._id).remove();
// //             }
// //             campsite.save()
// //             .then(campsite => {
// //                 res.statusCode = 200;
// //                 res.setHeader('Content-Type', 'application/json');
// //                 res.json(campsite);
// //             })
// //             .catch(err => next(err));
// //         } else {
// //             err = new Error(`Campsite ${req.params.campsiteId} not found`);
// //             err.status = 404;
// //             return next(err);
// //         }
// //     })
// //     .catch(err => next(err));
// // });

// // campsiteRouter.route('/:campsiteId/comments/:commentId')
// // .get((req, res, next) => {
// //     Campsite.findById(req.params.campsiteId)
// //     .populate('comments.author')
// //     .then(campsite => {
// //         if (campsite && campsite.comments.id(req.params.commentId)) {

// //             res.statusCode = 200;
// //             res.setHeader('Content-Type', 'application/json');
// //             res.json(campsite.comments.id(req.params.commentId));
// //         } else if (!campsite) {
// //             err = new Error(`Campsite ${req.params.campsiteId} not found`);
// //             err.status = 404;
// //             return next(err);
// //         } else {
// //             err = new Error(`Comment ${req.params.commentId} not found`);
// //             err.status = 404;
// //             return next(err);
// //         }
// //     })
// //     .catch(err => next(err));
// // })
// // .post(authenticate.verifyUser, (req, res) => {
// //     res.statusCode = 403;
// //     res.end(`POST operation not supported on /campsites/${req.params.campsiteId}/comments/${req.params.commentId}`);
// // })
// // .put(authenticate.verifyUser, (req, res, next) => {
// //     Campsite.findById(req.params.campsiteId)
// //     .then(campsite => {
// //         if (campsite && campsite.comments.id(req.params.commentId)) {






// //             if (req.body.rating) {
// //                 campsite.comments.id(req.params.commentId).rating = req.body.rating;
// //             }
// //             if (req.body.text) {
// //                 campsite.comments.id(req.params.commentId).text = req.body.text;
// //             }
// //             campsite.save()
// //             .then(campsite => {
// //                 res.statusCode = 200;
// //                 res.setHeader('Content-Type', 'application/json');
// //                 res.json(campsite);
// //             })
// //             .catch(err => next(err));
// //         } else if (!campsite) {
// //             err = new Error(`Campsite ${req.params.campsiteId} not found`);
// //             err.status = 404;
// //             return next(err);
// //         } else {
// //             err = new Error(`Comment ${req.params.commentId} not found`);
// //             err.status = 404;
// //             return next(err);
// //         }
// //     })
// //     .catch(err => next(err));
// // })
// // .delete(authenticate.verifyUser, (req, res, next) => {
// //     Campsite.findById(req.params.campsiteId)
// //     .then(campsite => {
// //         if (campsite && campsite.comments.id(req.params.commentId)) {
// //             campsite.comments.id(req.params.commentId).remove();
// //             campsite.save()
// //             .then(campsite => {
// //                 res.statusCode = 200;
// //                 res.setHeader('Content-Type', 'application/json');
// //                 res.json(campsite);
// //             })
// //             .catch(err => next(err));
// //         } else if (!campsite) {
// //             err = new Error(`Campsite ${req.params.campsiteId} not found`);
// //             err.status = 404;
// //             return next(err);
// //         } else {
// //             err = new Error(`Comment ${req.params.commentId} not found`);
// //             err.status = 404;
// //             return next(err);
// //         }
// //     })
// //     .catch(err => next(err));
// // });

// // module.exports = campsiteRouter;










// // // const express = require('express');
// // // const Campsite = require('../models/campsite');
// // // const authenticate = require('../authenticate');

// // // const campsiteRouter = express.Router();

// // // // Basic CRUD operations for /campsites
// // // // campsiteRouter.route('/')
// // // // .get((req, res, next) => {
// // // //     Campsite.find()
// // // //     .then(campsites => {
// // // //         res.statusCode = 200;
// // // //         res.setHeader('Content-Type', 'application/json');
// // // //         res.json(campsites);
// // // //     })
// // // //     .catch(err => next(err));
// // // // })


// // // campsiteRouter.route('/')
// // //     .get((req, res, next) => {
// // //         Campsite.find()
// // //         .populate('comments.author')
// // //         .then(campsites => {
// // //             res.statusCode = 200;
// // //             res.setHeader('Content-Type', 'application/json');
// // //             res.json(campsites);
// // //         })
// // //         .catch(err => next(err));
// // //     })








// // // .post((req, res, next) => {
// // //     Campsite.create(req.body)
// // //     .then(campsite => {
// // //         console.log('Campsite Created ', campsite);
// // //         res.statusCode = 200;
// // //         res.setHeader('Content-Type', 'application/json');
// // //         res.json(campsite);
// // //     })
// // //     .catch(err => next(err));
// // // })
// // // .put((req, res) => {
// // //     res.statusCode = 403;
// // //     res.end('PUT operation not supported on /campsites');
// // // })
// // // .delete((req, res, next) => {
// // //     Campsite.deleteMany()
// // //     .then(response => {
// // //         res.statusCode = 200;
// // //         res.setHeader('Content-Type', 'application/json');
// // //         res.json(response);
// // //     })
// // //     .catch(err => next(err));
// // // });

// // // // Individual campsite operations for /campsites/:campsiteId
// // // // campsiteRouter.route('/:campsiteId')
// // // // .get((req, res, next) => {
// // // //     Campsite.findById(req.params.campsiteId)
// // // //     .then(campsite => {
// // // //         res.statusCode = 200;
// // // //         res.setHeader('Content-Type', 'application/json');
// // // //         res.json(campsite);
// // // //     })
// // // //     .catch(err => next(err));
// // // // })


// // // campsiteRouter.route('/:campsiteId')
// // //     .get((req, res, next) => {
// // //         Campsite.findById(req.params.campsiteId)
// // //         .populate('comments.author')
// // //         .then(campsite => {
// // //             res.statusCode = 200;
// // //             res.setHeader('Content-Type', 'application/json');
// // //             res.json(campsite);
// // //         })
// // //         .catch(err => next(err));
// // //     })




// // // .post((req, res) => {
// // //     res.statusCode = 403;
// // //     res.end(`POST operation not supported on /campsites/${req.params.campsiteId}`);
// // // })
// // // .put((req, res, next) => {
// // //     Campsite.findByIdAndUpdate(req.params.campsiteId, {
// // //         $set: req.body
// // //     }, { new: true })
// // //     .then(campsite => {
// // //         res.statusCode = 200;
// // //         res.setHeader('Content-Type', 'application/json');
// // //         res.json(campsite);
// // //     })
// // //     .catch(err => next(err));
// // // })
// // // .delete((req, res, next) => {
// // //     Campsite.findByIdAndDelete(req.params.campsiteId)
// // //     .then(response => {
// // //         res.statusCode = 200;
// // //         res.setHeader('Content-Type', 'application/json');
// // //         res.json(response);
// // //     })
// // //     .catch(err => next(err));
// // // });

// // // // Comments operations for /campsites/:campsiteId/comments
// // // // campsiteRouter.route('/:campsiteId/comments')
// // // // .get((req, res, next) => {
// // // //     Campsite.findById(req.params.campsiteId)
// // // //     .then(campsite => {
// // // //         if (campsite) {
// // // //             res.statusCode = 200;
// // // //             res.setHeader('Content-Type', 'application/json');
// // // //             res.json(campsite.comments);
// // // //         } else {
// // // //             err = new Error(`Campsite ${req.params.campsiteId} not found`);
// // // //             err.status = 404;
// // // //             return next(err);
// // // //         }
// // // //     })
// // // //     .catch(err => next(err));
// // // // })
// // // // .post((req, res, next) => {
// // // //     Campsite.findById(req.params.campsiteId)
// // // //     .then(campsite => {
// // // //         if (campsite) {
// // // //             campsite.comments.push(req.body);


// // // campsiteRouter.route('/:campsiteId/comments')
// // //     .get((req, res, next) => {
// // //         Campsite.findById(req.params.campsiteId)
// // //         .populate('comments.author')
// // //         .then(campsite => {
// // //             if (campsite) {
// // //                 res.statusCode = 200;
// // //                 res.setHeader('Content-Type', 'application/json');
// // //                 res.json(campsite.comments);
// // //             } else {
// // //                 err = new Error(`Campsite ${req.params.campsiteId} not found`);
// // //                 err.status = 404;
// // //                 return next(err);
// // //             }
// // //         })
// // //         .catch(err => next(err));
// // //     })
// // //     .post(authenticate.verifyUser, (req, res, next) => {
// // //         Campsite.findById(req.params.campsiteId)
// // //         .then(campsite => {
// // //             if (campsite) {
// // //                 req.body.author = req.user._id;
// // //                 campsite.comments.push(req.body);


            
            
            
// // //             campsite.save()
// // //             .then(campsite => {
// // //                 res.statusCode = 200;
// // //                 res.setHeader('Content-Type', 'application/json');
// // //                 res.json(campsite);
// // //             })
// // //             .catch(err => next(err));
// // //         } else {
// // //             err = new Error(`Campsite ${req.params.campsiteId} not found`);
// // //             err.status = 404;
// // //             return next(err);
// // //         }
// // //     })
// // //     .catch(err => next(err));
// // // })
// // // .put((req, res) => {
// // //     res.statusCode = 403;
// // //     res.end(`PUT operation not supported on /campsites/${req.params.campsiteId}/comments`);
// // // })
// // // .delete((req, res, next) => {
// // //     Campsite.findById(req.params.campsiteId)
// // //     .then(campsite => {
// // //         if (campsite) {
// // //             for (let i = (campsite.comments.length-1); i >= 0; i--) {
// // //                 campsite.comments.id(campsite.comments[i]._id).deleteOne();
// // //             }
// // //             campsite.save()
// // //             .then(campsite => {
// // //                 res.statusCode = 200;
// // //                 res.setHeader('Content-Type', 'application/json');
// // //                 res.json(campsite);
// // //             })
// // //             .catch(err => next(err));
// // //         } else {
// // //             err = new Error(`Campsite ${req.params.campsiteId} not found`);
// // //             err.status = 404;
// // //             return next(err);
// // //         }
// // //     })
// // //     .catch(err => next(err));
// // // });

// // // // Individual comment operations for /campsites/:campsiteId/comments/:commentId
// // // // campsiteRouter.route('/:campsiteId/comments/:commentId')
// // // // .get((req, res, next) => {
// // // //     Campsite.findById(req.params.campsiteId)
// // // //     .then(campsite => {


// // // campsiteRouter.route('/:campsiteId/comments/:commentId')
// // //     .get((req, res, next) => {
// // //         Campsite.findById(req.params.campsiteId)
// // //         .populate('comments.author')
// // //         .then(campsite => {




// // //         if (campsite && campsite.comments.id(req.params.commentId)) {
// // //             res.statusCode = 200;
// // //             res.setHeader('Content-Type', 'application/json');
// // //             res.json(campsite.comments.id(req.params.commentId));
// // //         } else if (!campsite) {
// // //             err = new Error(`Campsite ${req.params.campsiteId} not found`);
// // //             err.status = 404;
// // //             return next(err);
// // //         } else {
// // //             err = new Error(`Comment ${req.params.commentId} not found`);
// // //             err.status = 404;
// // //             return next(err);
// // //         }
// // //     })
// // //     .catch(err => next(err));
// // // })
// // // .post((req, res) => {
// // //     res.statusCode = 403;
// // //     res.end(`POST operation not supported on /campsites/${req.params.campsiteId}/comments/${req.params.commentId}`);
// // // })
// // // .put((req, res, next) => {
// // //     Campsite.findById(req.params.campsiteId)
// // //     .then(campsite => {
// // //         if (campsite && campsite.comments.id(req.params.commentId)) {
// // //             if (req.body.rating) {
// // //                 campsite.comments.id(req.params.commentId).rating = req.body.rating;
// // //             }
// // //             if (req.body.text) {
// // //                 campsite.comments.id(req.params.commentId).text = req.body.text;
// // //             }
// // //             campsite.save()
// // //             .then(campsite => {
// // //                 res.statusCode = 200;
// // //                 res.setHeader('Content-Type', 'application/json');
// // //                 res.json(campsite);
// // //             })
// // //             .catch(err => next(err));
// // //         } else if (!campsite) {
// // //             err = new Error(`Campsite ${req.params.campsiteId} not found`);
// // //             err.status = 404;
// // //             return next(err);
// // //         } else {
// // //             err = new Error(`Comment ${req.params.commentId} not found`);
// // //             err.status = 404;
// // //             return next(err);
// // //         }
// // //     })
// // //     .catch(err => next(err));
// // // })
// // // .delete((req, res, next) => {
// // //     Campsite.findById(req.params.campsiteId)
// // //     .then(campsite => {
// // //         if (campsite && campsite.comments.id(req.params.commentId)) {
// // //             campsite.comments.id(req.params.commentId).deleteOne();
// // //             campsite.save()
// // //             .then(campsite => {
// // //                 res.statusCode = 200;
// // //                 res.setHeader('Content-Type', 'application/json');
// // //                 res.json(campsite);
// // //             })
// // //             .catch(err => next(err));
// // //         } else if (!campsite) {
// // //             err = new Error(`Campsite ${req.params.campsiteId} not found`);
// // //             err.status = 404;
// // //             return next(err);
// // //         } else {
// // //             err = new Error(`Comment ${req.params.commentId} not found`);
// // //             err.status = 404;
// // //             return next(err);
// // //         }
// // //     })
// // //     .catch(err => next(err));
// // // });

// // // module.exports = campsiteRouter;










// // // // const express = require('express');
// // // // const Campsite = require('../models/campsite');

// // // // const campsiteRouter = express.Router();

// // // // campsiteRouter.route('/')
// // // // .get((req, res, next) => {
// // // //     Campsite.find()
// // // //     .then(campsites => {
// // // //         res.statusCode = 200;
// // // //         res.setHeader('Content-Type', 'application/json');
// // // //         res.json(campsites);
// // // //     })
// // // //     .catch(err => next(err));
// // // // })
// // // // .post((req, res, next) => {
// // // //     Campsite.create(req.body)
// // // //     .then(campsite => {
// // // //         console.log('Campsite Created ', campsite);
// // // //         res.statusCode = 200;
// // // //         res.setHeader('Content-Type', 'application/json');
// // // //         res.json(campsite);
// // // //     })
// // // //     .catch(err => next(err));
// // // // })
// // // // .put((req, res) => {
// // // //     res.statusCode = 403;
// // // //     res.end('PUT operation not supported on /campsites');
// // // // })
// // // // .delete((req, res, next) => {
// // // //     Campsite.deleteMany()
// // // //     .then(response => {
// // // //         res.statusCode = 200;
// // // //         res.setHeader('Content-Type', 'application/json');
// // // //         res.json(response);
// // // //     })
// // // //     .catch(err => next(err));
// // // // });

// // // // campsiteRouter.route('/:campsiteId')
// // // // .get((req, res, next) => {
// // // //     Campsite.findById(req.params.campsiteId)
// // // //     .then(campsite => {
// // // //         res.statusCode = 200;
// // // //         res.setHeader('Content-Type', 'application/json');
// // // //         res.json(campsite);
// // // //     })
// // // //     .catch(err => next(err));
// // // // })
// // // // .post((req, res) => {
// // // //     res.statusCode = 403;
// // // //     res.end(`POST operation not supported on /campsites/${req.params.campsiteId}`);
// // // // })
// // // // .put((req, res, next) => {
// // // //     Campsite.findByIdAndUpdate(req.params.campsiteId, {
// // // //         $set: req.body
// // // //     }, { new: true })
// // // //     .then(campsite => {
// // // //         res.statusCode = 200;
// // // //         res.setHeader('Content-Type', 'application/json');
// // // //         res.json(campsite);
// // // //     })
// // // //     .catch(err => next(err));
// // // // })
// // // // .delete((req, res, next) => {
// // // //     Campsite.findByIdAndDelete(req.params.campsiteId)
// // // //     .then(response => {
// // // //         res.statusCode = 200;
// // // //         res.setHeader('Content-Type', 'application/json');
// // // //         res.json(response);
// // // //     })
// // // //     .catch(err => next(err));
// // // // });

// // // // module.exports = campsiteRouter;