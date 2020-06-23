import {connect} from "../src";
import {Order} from "./order.entity";
import {Item} from "./item.entity";
import {SearchCriteria} from "../src/interfaces/criteria";

connect({
    uri: process.env.MONGO_URL || 'mongodb+srv://aggregator_dev:aggregator_dev@cluster0-epwwu.gcp.mongodb.net/smartemail-types'
})
    .then(() => {
        const query: SearchCriteria<Order> = {
            $or: [
                {
                    id: '11111',
                    qty: 12,
                    price: {
                        $gte: 12,
                        $lte: 100
                    },
                },
            ],
            $and: [
                {
                    price: 10
                }
            ]
        };


        return Order.find(query)
    })
    .then((orders: Order[]) => {

        void orders;

        return Order.insert([
            {price: 122},
            {price: 222},
        ])
    })
    .then(orders => {

        void orders;

        return Order.create({ qty: 12 }).save()
    })
    .then(order => {

        void order;

        return new Order({ qty: 10 }).save()
    })
    .then(order => {

        void order;

        return Item.findOne({
            id: ''
        })
    })
    .then(item => {

        void item;
    })
    .catch(err => {

        void err
    })